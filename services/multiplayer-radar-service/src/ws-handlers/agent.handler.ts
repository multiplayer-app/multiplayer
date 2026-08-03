import { Server, Socket, Namespace } from 'socket.io'
import type { Request } from 'express'
import { JoiValidator, Joi } from '@multiplayer/util'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import {
  AgentEvents,
  AgentEventsMap,
  RoleProjectPermissionEntity,
  RoleAccessAction,
  WSCallback,
  AgentType,
  ErrorMessage,
  AgentChatMessageRole,
  AgentChatStatus,
  IAgent,
  IAgentChat,
  AgentChatStartReasonEnum,
} from '@multiplayer/types'
import {
  IssueModel,
  AgentModel,
  AgentChatModel,
  AgentChatMessageModel,
  WorkspaceUserModel,
  IntegrationModel,
  IAgentDocument,
  IAgentChatMessageDocument,
  IAgentChatDocument,
} from '@multiplayer/models'
import {
  socketAuthorize,
  socketCookieParser,
  socketExpressSession,
} from '@multiplayer/auth'
import { agentAttachmentSchema } from '../middleware/validation/schema/shared/agent.schema'
import { WebSocketHelper } from '../helpers'

import * as IssueService from '../services/issue.service'
import * as AgentService from '../services/agent.service'
// import * as AlertService from '../services/alert.service'
import * as ChatService from '../services/chat.service'
import { sseBus } from '../services/sse-bus.service'
import { AgentSessionCache } from '../cache'
import {
  disarmChatTimeout,
  noteAgentResponded,
  resetAgentConsecutiveTimeouts,
} from '../services/chat-timeout.service'
import {
  createChatMessageSchema,
  updateChatInHandlerSchema,
} from '../middleware/validation/schema/agent-chat.schema'

const TERMINAL_CHAT_STATUSES = new Set([
  AgentChatStatus.Finished,
  AgentChatStatus.Error,
  AgentChatStatus.Aborted,
])

// Statuses that represent a successful (non-timeout) resolution; used to reset
// the agent's consecutive-timeout counter.
const SUCCESSFUL_TERMINAL_STATUSES = new Set([
  AgentChatStatus.Finished,
  AgentChatStatus.Aborted,
])

// Statuses that put a chat (back) into active processing.
const RESUMABLE_CHAT_STATUSES = new Set([
  AgentChatStatus.Processing,
  AgentChatStatus.Streaming,
])

// Failure statuses an agent may resurrect a chat from after a reconnect
// (deliberate terminal states — finished/aborted — are not resumable).
const FAILED_CHAT_STATUSES = new Set([
  AgentChatStatus.Error,
  AgentChatStatus.Timedout,
])

const AGENT_NAMESPACE_REGEX =
  /^\/workspaces\/([a-fA-F0-9]{24})\/projects\/([a-fA-F0-9]{24})\/agents$/

// Socket.io middleware enriches socket.request, but the type system doesn't
// reflect that — we keep the intersection for handler signatures and cast in onConnect.
type AgentSocket = Socket & { request: Request };

export class AgentNamespaceHandler {
  private io: Server
  private namespace: Namespace

  constructor(io: Server) {
    this.io = io
    this.namespace = this.io.of(AGENT_NAMESPACE_REGEX)

    this.namespace.use(socketCookieParser)
    this.namespace.use(socketExpressSession)
    this.namespace.use(WebSocketHelper.extractIdsFromNamespace)
    this.namespace.use((socket, next) =>
      socketAuthorize(
        {
          entity: RoleProjectPermissionEntity.AGENT,
          action: RoleAccessAction.READ,
        },
        {
          workspaceId: socket.data.workspaceId,
          projectId: socket.data.projectId,
        },
      )(socket, next),
    )
    this.namespace.use(async (socket, next) => {
      const isDebuggingAgent =
        socket.handshake.auth?.['x-is-debugging-agent'] === 'true'

      if (isDebuggingAgent) {
        const agentName = socket.handshake.auth?.['x-agent-name'] as
          | string
          | undefined
        const contextPath = socket.handshake.auth?.['x-context-path'] as
          | string
          | undefined
        const maxConcurrentIssues =
          Number(socket.handshake.auth?.['x-max-concurrent-issues']) || 2
        const noGitBranch =
          socket.handshake.auth?.['x-no-git-branch'] === 'true'
        const model = socket.handshake.auth?.['x-model'] as string | undefined
        const availableModels: string[] = (() => {
          try {
            const raw = socket.handshake.auth?.['x-available-models']
            return raw ? JSON.parse(raw) : []
          } catch {
            return []
          }
        })()

        const req = socket.request as any
        let workspaceUser: string | undefined

        if (req.rawApiKeyPayload?.integration) {
          const integration = await IntegrationModel.findIntegrationById(
            req.rawApiKeyPayload.integration,
          )
          workspaceUser = integration?.workspaceUser?.toString()
        } else if (req.user?._id) {
          const wsUser = await WorkspaceUserModel.findWorkspaceUser(
            req.user._id,
            socket.data.workspaceId,
          )
          workspaceUser = wsUser?._id.toString()
        }

        if (!workspaceUser) {
          return next(new Error('Could not resolve workspaceUser for agent'))
        }

        // Upsert on stable identity so reconnects (blips, deploys) reuse the
        // same agent document instead of leaking a new one per socket.
        const agent = await AgentModel.upsertAgentByIdentity({
          workspace: socket.data.workspaceId,
          project: socket.data.projectId,
          socketId: socket.id,
          name: agentName,
          type: AgentType.DEBUGGING,
          maxConcurrentIssues,
          contextPath,
          noGitBranch,
          model,
          availableModels,
          workspaceUser,
        })

        // The counter survives reconnects, but a restarted CLI has no memory
        // of old claims — re-baseline against the chats actually in flight.
        const activeChats = await AgentChatModel.countActiveChatsByAgent(agent._id)
        if ((agent.issuesInProgress ?? 0) !== activeChats) {
          await AgentModel.syncIssuesInProgress(agent._id, activeChats)
          agent.issuesInProgress = activeChats
        }

        socket.data.agent = agent
        socket.data.agentId = agent._id.toString()
      }

      return next()
    })
  }

  initialize() {
    this.namespace.on('connection', this.onConnect.bind(this))
  }

  // ─── Broadcast helpers ─────────────────────────────────────────────────────

  emitMessageToRoom(
    workspaceId: string,
    projectId: string,
    room: string,
    event: string,
    data: unknown,
    except?: string,
  ): void {
    const namespaceName = `/workspaces/${workspaceId}/projects/${projectId}/agents`

    const ns = this.io.of(namespaceName)
    let target: { emit: (event: string, data: unknown) => void } = ns
    if (room !== '/') {
      target = ns.in(room)
    }
    if (except) {
      target = ns.except(except)
    }

    target.emit(event, data)
    logger.debug({ room, event }, '[AGENT_WEBSOCKET] Emit message to room')
  }

  /**
   * Emits to a room and waits for acknowledgments from the sockets in it.
   * Returns the ack payloads received before the timeout. An empty array means
   * nobody acked — either no socket is in the room, or the client predates ack
   * support — callers must treat that as "unknown", not as failure.
   */
  async emitToRoomWithAck<T>(
    workspaceId: string,
    projectId: string,
    room: string,
    event: string,
    data: unknown,
    timeoutMs: number,
  ): Promise<T[]> {
    const namespaceName = `/workspaces/${workspaceId}/projects/${projectId}/agents`

    try {
      const responses = await this.io
        .of(namespaceName)
        .in(room)
        .timeout(timeoutMs)
        .emitWithAck(event, data)
      return (responses ?? []).filter((r: unknown) => r !== undefined && r !== null) as T[]
    } catch (error) {
      // Timeout: some sockets did not ack (old clients never will) — return
      // whatever we can distinguish, which for socket.io is nothing.
      logger.debug({ room, event, error: String(error) }, '[AGENT_WEBSOCKET] Ack emit timed out')
      return []
    }
  }

  /**
   * Emit a chat-scoped event to all subscribers of a specific chat room.
   * Prefer this over emitMessageToRoom(..., '/') for per-chat events such as
   * AGENT_MESSAGE_NEW and AGENT_CHAT_UPDATE.
   */
  emitToChatRoom(
    workspaceId: string,
    projectId: string,
    chatId: string,
    event: string,
    data: unknown,
  ): void {
    const room = WebSocketHelper.getChatRoom(workspaceId, projectId, chatId)
    this.emitMessageToRoom(workspaceId, projectId, room, event, data)
  }

  /**
   * Broadcasts a message/update to both WebSocket clients and SSE subscribers.
   * Extracts the repeated io.emit + sseBus.publish pattern used throughout handlers.
   */
  private broadcastEvent(
    socket: AgentSocket,
    event: string,
    data: unknown,
    chatId?: string,
    options?: { room?: string; except?: string },
  ): void {
    const ns = this.io.of(socket.nsp.name)
    let target: any = ns
    if (options?.room) {
      target = target.to(options.room)
    }
    if (options?.except) {
      target = target.except(options.except)
    }
    target.emit(event, data)

    if (chatId) {
      sseBus.publish(chatId, event, data)
    }

    logger.debug(
      {
        event,
        namespace: socket.nsp.name,
        optionsRoom: options?.room,
        optionsExcept: options?.except,
      },
      '[AGENT_WS_HANDLER] broadcastEvent',
    )
  }

  async isAgentConnected(agent: IAgent | IAgentDocument): Promise<boolean> {
    const agentRoom = WebSocketHelper.getAgentRoomInProject(
      agent.workspace,
      agent.project,
      agent._id.toString(),
    )

    const namespace = `/workspaces/${agent.workspace}/projects/${agent.project}/agents`
    const sockets = await this.io.of(namespace).in(agentRoom).fetchSockets()

    return sockets.length > 0
  }

  async disconnectAgentSockets(agent: IAgentDocument) {
    const agentRoom = WebSocketHelper.getAgentRoomInProject(
      agent.workspace,
      agent.project,
      agent._id.toString(),
    )

    const namespace = `/workspaces/${agent.workspace}/projects/${agent.project}/agents`
    const sockets = await this.io.of(namespace).in(agentRoom).fetchSockets()

    return sockets.forEach((s) => s.disconnect(true))
  }

  onConnect(_socket: Socket) {
    // Middleware (socketCookieParser, socketExpressSession, socketAuthorize) enriches
    // socket.request with Express-compatible fields — safe to cast after middleware runs.
    const socket = _socket as AgentSocket
    const isDebuggingAgent =
      socket.handshake.auth?.['x-is-debugging-agent'] === 'true'

    if (isDebuggingAgent) {
      socket.once('disconnect', () =>
        this.handleDebuggingAgentDisconnect(socket),
      )
      socket.on(AgentEvents.AGENT_MESSAGE_NEW, (params, callback) =>
        this.handleAgentMessageNew(socket, params, callback),
      )
      socket.on(AgentEvents.AGENT_CHAT_UPDATE, (params, callback) =>
        this.handleAgentChatUpdate(socket, params, callback),
      )
      socket.on(AgentEvents.DEBUGGING_AGENT_FIX_FAILED, (params, callback) =>
        this.handleDebuggingAgentFixFailed(socket, params, callback),
      )
      socket.on(AgentEvents.DEBUGGING_AGENT_FIX_PUSHED, (params, callback) =>
        this.handleDebuggingAgentFixPushed(socket, params, callback),
      )
      socket.on(AgentEvents.DEBUGGING_AGENT_READY, () =>
        this.handleIssueCheck(socket),
      )
      socket.on(AgentEvents.DEBUGGING_AGENT_UPDATE, (params) =>
        this.handleDebuggingAgentUpdate(socket, params),
      )

      const agentRoom = WebSocketHelper.getAgentRoomInProject(
        socket.data.workspaceId,
        socket.data.projectId,
        socket.data.agentId,
      )
      socket.join(agentRoom)

      logger.debug(
        {
          agentRoom,
          agentId: socket.data.agentId,
          workspace: socket.data.workspaceId,
          project: socket.data.projectId,
        },
        '[WEBSOCKET] Debugging agent connected and registered',
      )

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_CONNECTED,
        socket.data.agent,
        undefined,
        { except: socket.id },
      )
    } else {
      socket.on(AgentEvents.AGENT_MESSAGE_NEW, (params, callback) =>
        this.handleUserMessage(socket, params, callback),
      )
      socket.on(AgentEvents.AGENT_CHAT_SUBSCRIBE, (params, callback) =>
        this.handleAgentChatSubscribe(socket, params, callback),
      )
      socket.on(AgentEvents.AGENT_CHAT_UNSUBSCRIBE, (params, callback) =>
        this.handleAgentChatUnsubscribe(socket, params, callback),
      )
    }
  }

  async handleDebuggingAgentDisconnect(socket: AgentSocket) {
    try {
      if (!socket.data.agentId) return

      const { agentId } = socket.data

      // Do NOT kill chats or delete the agent here: disconnects are often
      // transient (network blip, service deploy) and the CLI keeps working
      // and reconnects. Mark the timestamp; the stuck-agent sweep hard-reaps
      // (fails chats, resets issues, deletes the doc) only after the grace
      // period expires without a reconnect.
      await AgentModel.markAgentDisconnected(agentId)

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_DISCONNECTED,
        {
          _id: agentId,
        },
        undefined,
        { except: socket.id },
      )

      logger.debug(
        { agentId },
        '[WEBSOCKET] Debugging agent disconnected and removed',
      )
    } catch (error) {
      logger.error(
        error,
        '[WEBSOCKET] Error handling debugging agent disconnect',
      )
    }
  }

  async handleAgentMessageNew(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(data, createChatMessageSchema)

      if (!data.content?.length) {
        delete data.content
      }

      const agentChatId = data.chat

      // The agent is alive and producing output — clear the AI-response
      // deadline so the stuck-chat sweep doesn't time this chat out.
      noteAgentResponded(agentChatId)

      data = ChatService.prepareMessageAttachments(data)

      const messagePayload = {
        ...data,
        _id: data._id,
        chat: agentChatId,
        workspace: socket.data.workspaceId,
        project: socket.data.projectId,
      }

      let message: IAgentChatMessageDocument

      if (data.role === AgentChatMessageRole.Reasoning) {
        message = {
          ...messagePayload,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as IAgentChatMessageDocument
      } else if (data._id) {
        // Streaming chunk — upsert into the same document using the client-generated ObjectId
        message = await AgentChatMessageModel.upsertMessage(messagePayload)
      } else {
        message = await AgentChatMessageModel.createMessage(messagePayload)
      }

      const messageData = message?.toObject?.() || message
      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_MESSAGE_NEW,
        messageData,
        agentChatId,
        { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, agentChatId), except: socket.id },
      )

      // Disarm the AI-response timeout as soon as the first message arrives —
      // the agent is clearly alive and responding.
      disarmChatTimeout(agentChatId)
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling agent message new')
    }
  }

  async handleAgentChatUpdate(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.AGENT_CHAT_UPDATE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(data, updateChatInHandlerSchema)
      const agentChatId = data._id

      // For terminal statuses, transition atomically first so the capacity
      // slot is released exactly once per chat (a `finished` update followed
      // by `fix-pushed` must not double-release) and is charged to the chat's
      // owning agent rather than whichever socket reported the status.
      let releaseAgentId: string | undefined
      if (TERMINAL_CHAT_STATUSES.has(data.status)) {
        const prior = await AgentChatModel.finalizeAgentChatStatus(agentChatId, data.status)
        if (prior) {
          releaseAgentId = prior.agent?.toString()
        }
      } else if (RESUMABLE_CHAT_STATUSES.has(data.status)) {
        // Resurrection: an agent re-adopting work after a reconnect flips an
        // error/timedout chat back to processing. Re-claim the capacity slot
        // that was released when the chat was failed, so the counter matches
        // the work actually in flight.
        const existing = await AgentChatModel.findAgentChatById(agentChatId)
        if (
          existing
          && FAILED_CHAT_STATUSES.has(existing.status)
          && existing.agent
        ) {
          await AgentModel.claimIssueCapacitySlot(
            socket.data.workspaceId,
            socket.data.projectId,
            existing.agent.toString(),
          )
        }
      }

      const agentChat = await AgentChatModel.updateAgentChatById(
        agentChatId,
        data,
      )

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_CHAT_UPDATE,
        agentChat,
        agentChatId,
        { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, agentChatId), except: socket.id },
      )

      if (TERMINAL_CHAT_STATUSES.has(data.status)) {
        disarmChatTimeout(agentChatId)
        if (releaseAgentId) {
          await AgentModel.releaseIssueCapacitySlot(releaseAgentId)
        }
        await AgentSessionCache.unset(agentChatId)

        // Reset consecutive-timeout counter when the agent successfully finishes
        // or aborts a chat (i.e. not due to a timeout).
        if (SUCCESSFUL_TERMINAL_STATUSES.has(data.status)) {
          await resetAgentConsecutiveTimeouts(socket.data.agentId)
        }
      }

      logger.debug(
        {
          agentChatId,
          status: data.status,
        },
        '[WEBSOCKET] Agent chat updated',
      )
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling agent chat update')
    }
  }

  async handleAgentChatSubscribe(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.AGENT_CHAT_SUBSCRIBE]['requestParams'],
    callback?: WSCallback<{ messages: unknown[] }>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          chatId: Joi.string().hex().length(24).required(),
        }),
      )

      const chatRoom = WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, data.chatId)
      socket.join(chatRoom)

      logger.debug(
        { chatId: data.chatId },
        '[WEBSOCKET] Client subscribed to agent session',
      )
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling agent chat subscribe')
    }
  }

  async handleAgentChatUnsubscribe(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.AGENT_CHAT_UNSUBSCRIBE]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          chatId: Joi.string().hex().length(24).required(),
        }),
      )

      const chatRoom = WebSocketHelper.getChatRoom(
        socket.data.workspaceId,
        socket.data.projectId,
        data.chatId,
      )
      socket.leave(chatRoom)

      logger.debug(
        { chatId: data.chatId },
        '[WEBSOCKET] Client unsubscribed from agent session',
      )
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling agent chat unsubscribe')
    }
  }

  async handleUserMessage(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['requestParams'] & {
      agentChatId: string;
      workspaceId: string;
      projectId: string;
    },
    callback?: WSCallback<void>,
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          workspaceId: Joi.string().hex().required(),
          projectId: Joi.string().hex().required(),
          agentChatId: Joi.string().required(),
          content: Joi.string().required(),
          attachments: Joi.array().items(agentAttachmentSchema).optional(),
        }).unknown(true),
      )

      const agentChat = await AgentChatModel.findAgentChatById(
        data.agentChatId,
      )

      if (!agentChat) {
        throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
      }

      await AgentChatMessageModel.createMessage({
        workspace: data.workspaceId,
        project: data.projectId,
        chat: agentChat._id.toString(),
        role: AgentChatMessageRole.User,
        content: data.content,
      })

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_MESSAGE_NEW,
        data,
        data.chat,
        { room: WebSocketHelper.getChatRoom(data.workspaceId, data.projectId, data.chat), except: socket.id },
      )

      logger.debug(
        { agentId: data.agentChatId },
        '[WEBSOCKET] Forwarded user message to debugging agent',
      )
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling user message to agent')
    }
  }

  async handleDebuggingAgentUpdate(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.DEBUGGING_AGENT_UPDATE]['requestParams'],
  ) {
    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          name: Joi.string().optional(),
          maxConcurrentIssues: Joi.number().integer().min(1).optional(),
          model: Joi.string().optional(),
          settings: Joi.object({
            issueSubscription: Joi.object({
              componentName: Joi.array().items(Joi.string()).optional(),
              environmentName: Joi.array().items(Joi.string()).optional(),
            }).optional(),
            autoResolveIssues: Joi.boolean().optional(),
            fixabilityScoreThreshold: Joi.number().optional(),
          }).optional(),
        }),
      )

      await AgentService.updateAgentById(
        socket.data.workspaceId,
        socket.data.projectId,
        socket.data.agentId,
        data,
      )
    } catch (error) {
      logger.error(
        error,
        { event: AgentEvents.DEBUGGING_AGENT_UPDATE },
        '[WEBSOCKET] Error handling debugging agent update',
      )
    }
  }

  async handleIssueCheck(socket: AgentSocket) {
    try {
      if (!socket.data.agentId) return

      const agent = await AgentModel.findAgentById(socket.data.agentId)
      if (!agent) {
        logger.warn(
          { agentId: socket.data.agentId },
          '[WEBSOCKET] Agent not found during issue check',
        )
        return
      }

      await AgentService.findAndAssignIssueToAgent(
        agent,
        AgentChatStartReasonEnum.AGENT_REQUEST,
      )
    } catch (error) {
      logger.error(error, '[WEBSOCKET] Error handling issue check')
    }
  }

  // ─── Debugging agent lifecycle handlers ────────────────────────────────────

  async handleDebuggingAgentFixPushed(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.DEBUGGING_AGENT_FIX_PUSHED]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    data = JoiValidator.validate(
      data,
      Joi.object({
        chatId: Joi.string().hex().length(24).required(),
        git: Joi.object({
          branchName: Joi.string().required(),
          branchUrl: Joi.string().optional().allow(''),
          repositoryUrl: Joi.string().optional().allow(''),
          prUrl: Joi.string(),
          prTitle: Joi.string().optional().allow(''),
          prBody: Joi.string().optional().allow(''),
          codeChanges: Joi.object({
            additions: Joi.number().integer().min(0),
            deletions: Joi.number().integer().min(0),
          }),
        }).required(),
        issue: Joi.object({
          componentHash: Joi.string().required(),
        }).required(),
      }),
    )

    // Set only when this event performed the chat's active→terminal
    // transition; the matching capacity slot is released exactly once.
    let releaseAgentId: string | undefined

    try {
      const {
        issue: { componentHash },
        git: {
          branchName,
          branchUrl,
          repositoryUrl,
          prUrl: initialPrUrl,
          prTitle,
          prBody,
          codeChanges,
        },
      } = data
      let prUrl = initialPrUrl

      const prior = await AgentChatModel.finalizeAgentChatStatus(
        data.chatId,
        AgentChatStatus.Finished,
      )
      if (prior) {
        releaseAgentId = prior.agent?.toString()
      }

      let agentChat = (await AgentChatModel.findAgentChatById(
        data.chatId,
      )) as IAgentChatDocument
      let prAlreadyExisted = false
      if (agentChat.git?.prUrl) {
        prAlreadyExisted = true
      }

      if (
        !prUrl
        && !prAlreadyExisted
        && repositoryUrl
        && prTitle
        && prBody
      ) {
        try {
          const issue = await IssueService.getIssueByComponentHash(
            socket.data.workspaceId,
            socket.data.projectId,
            componentHash,
          )

          if (!issue) {
            throw new Error('Issue not found')
          }

          prUrl = await IssueService.createPrForIssue(
            issue,
            repositoryUrl,
            branchName,
            {
              title: prTitle as string,
              body: prBody as string,
            },
          )

          const prMessage = await AgentChatMessageModel.createMessage({
            workspace: agentChat.workspace,
            project: agentChat.project,
            chat: data.chatId,
            role: AgentChatMessageRole.Assistant,
            content: `Pull request created: [${prUrl}](${prUrl})`,
            activity: 'git',
          })
          this.broadcastEvent(
            socket,
            AgentEvents.AGENT_MESSAGE_NEW,
            prMessage.toObject(),
            data.chatId,
            { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, data.chatId) },
          )
        } catch (e) {
          logger.error(
            e,
            { componentHash },
            '[WS_AGENT_HANDLER] Failed to create PR for issue fix',
          )
        }
      }

      await IssueModel.bulkUpdateIssues(
        socket.data.workspaceId,
        socket.data.projectId,
        { componentHash: [componentHash] },
        {
          resolved: true,
          solution: {
            inProgress: false,
            agent: undefined,
            gitBranch: branchName,
            gitRepositoryUrl: repositoryUrl || undefined,
            prUrl,
            fixWithAgentFailed: false,
          },
        },
      )

      const update: Partial<IAgentChat> = {
        status: AgentChatStatus.Finished,
        git: {
          branchName,
          ...(branchUrl ? { branchUrl } : {}),
          ...(prUrl ? { prUrl } : {}),
          ...(codeChanges ? { codeChanges } : {}),
        },
      }
      agentChat = (await AgentChatModel.updateAgentChatById(
        data.chatId,
        update,
      )) as IAgentChatDocument

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_CHAT_UPDATE,
        agentChat,
        data.chatId,
        { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, data.chatId) },
      )

      logger.debug(
        {
          agentId: socket.data.agentId,
          componentHash,
          branchName,
          codeChanges,
        },
        '[WEBSOCKET] Debugging agent fix pushed',
      )
    } catch (error) {
      logger.error(
        error,
        '[WEBSOCKET] Error handling debugging agent fix pushed',
      )
    } finally {
      if (releaseAgentId) {
        await AgentModel.releaseIssueCapacitySlot(releaseAgentId)
      }
      await AgentSessionCache.unset(data.chatId)
    }
  }

  async handleDebuggingAgentFixFailed(
    socket: AgentSocket,
    data: AgentEventsMap[AgentEvents.DEBUGGING_AGENT_FIX_FAILED]['requestParams'],
    callback?: WSCallback<void>,
  ) {
    // Set only when this event performed the chat's active→terminal
    // transition; the matching capacity slot is released exactly once.
    let releaseAgentId: string | undefined

    try {
      data = JoiValidator.validate(
        data,
        Joi.object({
          chatId: Joi.string().hex().length(24).required(),
          issue: Joi.object({
            componentHash: Joi.string().required(),
          }).required(),
          error: Joi.string().optional(),
        }),
      )

      await IssueModel.bulkUpdateIssues(
        socket.data.workspaceId,
        socket.data.projectId,
        { componentHash: [data.issue.componentHash] },
        {
          solution: {
            fixWithAgentFailed: true,
            agent: undefined,
            gitBranch: undefined,
            prUrl: undefined,
            inProgress: false,
          },
        },
      )

      const prior = await AgentChatModel.finalizeAgentChatStatus(
        data.chatId,
        AgentChatStatus.Error,
      )
      if (prior) {
        releaseAgentId = prior.agent?.toString()
      }

      const agentChat = (await AgentChatModel.findAgentChatById(
        data.chatId,
      )) as IAgentChatDocument

      const errorMessage = await AgentChatMessageModel.createMessage({
        workspace: socket.data.workspaceId,
        project: socket.data.projectId,
        chat: data.chatId,
        role: AgentChatMessageRole.Error,
        content: data.error ?? 'Fix failed',
        agentName: 'debugging-agent',
      })

      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_MESSAGE_NEW,
        errorMessage.toObject(),
        data.chatId,
        { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, data.chatId) },
      )
      this.broadcastEvent(
        socket,
        AgentEvents.AGENT_CHAT_UPDATE,
        agentChat,
        data.chatId,
        { room: WebSocketHelper.getChatRoom(socket.data.workspaceId, socket.data.projectId, data.chatId), except: socket.id },
      )

      logger.warn(
        {
          agentId: socket.data.agentId,
          issueComponentHash: data.issue.componentHash,
        },
        '[WEBSOCKET] Debugging agent fix failed',
      )
    } catch (error) {
      logger.error(
        error,
        '[WEBSOCKET] Error handling debugging agent fix failed',
      )
    } finally {
      if (releaseAgentId) {
        await AgentModel.releaseIssueCapacitySlot(releaseAgentId)
      }
      await AgentSessionCache.unset(data.chatId)
    }
  }
}
