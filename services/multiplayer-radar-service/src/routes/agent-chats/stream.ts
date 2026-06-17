import type { Request, Response, NextFunction } from 'express'
import { PreconditionRequiredError } from 'restify-errors'
import {
  AgentChatMessageModel,
} from '@multiplayer/models'
import {
  AgentChatMessageRole,
  AgentEvents,
  AgentEventsMap,
  StreamChunkType,
} from '@multiplayer/types'
import type { IAgentAttachment } from '@multiplayer/types'
import type {
  SendMessagePayload,
  SendMessagePayloadWithContent,
  SendMessagePayloadWithApproval,
} from '@multiplayer-app/ai-agent-types'
import { WebSocketHelper } from '../../helpers'
import { sseBus } from '../../services/sse-bus.service'
import * as ChatService from '../../services/chat.service'
import * as AgentService from '../../services/agent.service'
import * as websocket from '../../websocket'
import {
  getSessionNotesContextForChat,
  injectSessionNotesContextMessage,
} from '../../services/session-notes-context.service'
import {
  armChatTimeout,
  disarmChatTimeout,
} from '../../services/chat-timeout.service'

const TERMINAL_CHAT_STATUSES = new Set(['finished', 'aborted', 'error', 'timedout'])
const AGENT_EVENTS_TO_STREAM_MAP = {
  [AgentEvents.AGENT_MESSAGE_NEW]: StreamChunkType.Message,
  [AgentEvents.AGENT_CHAT_UPDATE]: StreamChunkType.Chat,
}
const isApprovalPayload = (body: SendMessagePayload): body is SendMessagePayloadWithApproval => {
  return 'approvalId' in body
}

export const streamMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const body = req.body as SendMessagePayload

    const agentChat = await ChatService.upsertAndGetChat({
      ...body,
      userId: req.context.workspaceUserId,
      context: {
        headers: req.headers as Record<string, string>,
        data: {},
      },
    })

    const chatId = agentChat._id.toString()

    let agent = await AgentService.getAgentByChatId(chatId)
    if (!agent) {
      agent = await AgentService.reassignChatToAvailableAgent(agentChat) ?? undefined

      if (!agent) {
        throw new PreconditionRequiredError('No available agents to handle this chat at the moment. Please try again later.')
      }
    }

    let agentChatMessage: Awaited<ReturnType<typeof AgentChatMessageModel.createMessage>>

    if (isApprovalPayload(body)) {
      // Approval response — persist as user message with approval data in annotations
      agentChatMessage = await AgentChatMessageModel.createMessage({
        workspace: workspaceId,
        project: projectId,
        chat: agentChat._id.toString(),
        workspaceUser: req.context.workspaceUserId,
        role: AgentChatMessageRole.User,
        content: body.userResponse ?? '',
        annotations: {
          approvalId: body.approvalId,
          approved: body.approved,
          messageId: body.messageId,
          userResponse: body.userResponse,
        },
      })
    } else {
      let contentBody = body as SendMessagePayloadWithContent

      contentBody = ChatService.prepareMessageAttachments(contentBody as any) as any

      agentChatMessage = await AgentChatMessageModel.createMessage({
        workspace: workspaceId,
        project: projectId,
        chat: agentChat._id.toString(),
        workspaceUser: req.context.workspaceUserId,
        role: AgentChatMessageRole.User,
        content: contentBody.content,
        attachments: contentBody.attachments as unknown as IAgentAttachment[],
      })
    }

    // On the first user message in a chat linked to a debug session, inject notes context
    if (!isApprovalPayload(body) && agentChat.metadata?.debugSession?._id) {
      const messageCount = await AgentChatMessageModel.countDocuments({ chat: chatId })
      if (messageCount === 1) {
        const notesContext = await getSessionNotesContextForChat(agentChat.toObject())
        if (notesContext) {
          await injectSessionNotesContextMessage({
            context: notesContext,
            chatId,
            workspaceId,
            projectId,
          })
        }
      }
    }

    // Populate presigned URLs on attachments so the CLI agent can fetch file content.
    // Use a 1-hour TTL so the URL remains valid even if the agent is busy processing
    // another turn when this message arrives (default 120 s would expire too fast).
    // This is fire-and-forget safe — populateAttachmentUrls mutates in place and
    // the message object is not persisted again after this point.
    const messageForWs = await ChatService.populateAttachmentUrls(agentChatMessage.toObject() as any, 3600)

    // Broadcast user message to other connected clients via socket
    websocket.agentNamespaceHandler.emitToChatRoom(
      workspaceId,
      projectId,
      chatId,
      AgentEvents.AGENT_MESSAGE_NEW,
      messageForWs as AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['responseParams'],
    )

    // Set up SSE response before emitting to agent to avoid race condition
    const origin = req.headers.origin as string | undefined
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    let closed = false

    const unsubscribe = sseBus.subscribe(agentChat._id.toString(), ({ event, data }) => {
      if (closed) return
      res.write(`event: ${AGENT_EVENTS_TO_STREAM_MAP[event] ?? event}\ndata: ${JSON.stringify(data)}\n\n`)

      // Disarm the timeout as soon as the AI sends any event (message or status update)
      disarmChatTimeout(chatId)

      if (event === AgentEvents.AGENT_CHAT_UPDATE) {
        const chatData = data as { status?: string }
        if (TERMINAL_CHAT_STATUSES.has(chatData.status ?? '')) {
          cleanup()
          res.end()
        }
      }
    })

    const cleanup = () => {
      if (closed) return
      closed = true
      unsubscribe()
      req.off('close', onClose)
    }

    const onClose = () => cleanup()
    req.on('close', onClose)

    // Emit to agent after SSE is subscribed to avoid missing early events.
    // Reuse the already-populated messageForWs so the agent gets presigned URLs.
    const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, agent._id.toString())
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      agentRoom,
      AgentEvents.AGENT_MESSAGE_NEW,
      messageForWs as AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['responseParams'],
    )

    // Arm the AI-response timeout. The timer is disarmed as soon as any SSE event
    // arrives from the agent (message or status update). If it fires, the chat is
    // marked as timedout and the agent's capacity slot is released.
    armChatTimeout(chatId, agent._id.toString(), workspaceId, projectId)
  } catch (err) {
    return next(err)
  }
}
