import {
  IIssueDocument,
  AgentModel,
  AgentChatModel,
  AgentChatMessageModel,
  IAgentChatDocument,
  ReleaseModel,
  IReleaseDocument,
  IssueModel,
  IAgentDocument,
  IntegrationModel,
} from '@multiplayer/models'
import {
  EntityType,
  AgentEvents,
  AgentEventsMap,
  AgentChatStatus,
  AgentChatType,
  AgentChatStartReasonEnum,
  IIssue,
  OtelAgentSelectionMode,
  IntegrationTypeEnum,
  IAgent,
  ErrorMessage,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import logger from '@multiplayer/logger'
import redis from '@multiplayer/redis'
import { s3 } from '@multiplayer/s3'
import { ObjectId } from '@multiplayer/mongo'
import { WebSocketHelper } from '../helpers'
import * as EntityService from './entity.service'
import * as ProjectService from './project.service'
import * as IssueService from './issue.service'
import * as websocket from '../websocket'
import { AgentChatLib } from '../libs'
import { AgentSessionCache } from '../cache'
import {
  REDIS_ISSUE_RESOLVE_LOCK_PREFIX,
  REDIS_ISSUE_RESOLVE_LOCK_TTL,
  DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD,
} from '../config'

const MAX_AGENT_CHAT_ASSIGN_ATTEMPTS = 5

export type AgentChatBulkFilter = {
  ids?: string[]
  status?: AgentChatStatus
  agentId?: string
  type?: AgentChatType
}

const buildAgentChatBulkConditions = (
  workspaceId: string,
  projectId: string,
  filter: AgentChatBulkFilter = {},
) => {
  const conditions: Record<string, unknown> = {
    workspace: new ObjectId(workspaceId),
    project: new ObjectId(projectId),
  }

  if (filter.ids?.length) {
    conditions._id = {
      $in: filter.ids.map(id => new ObjectId(id)),
    }
  }
  if (filter.status) {
    conditions.status = filter.status
  }
  if (filter.agentId) {
    conditions.agent = new ObjectId(filter.agentId)
  }
  if (filter.type) {
    conditions.type = filter.type
  }

  return conditions
}

const isNarrowedToEmptyIdList = (filter: AgentChatBulkFilter): boolean => {
  const hasExtraScope = Boolean(
    filter.status
    || filter.agentId
    || filter.type,
  )
  const ids = filter.ids
  return (
    ids !== undefined
    && ids.length === 0
    && !hasExtraScope
  )
}

export type AgentChatBulkPayload = {
  title?: string
  archived?: boolean
  metadata?: Record<string, unknown>
  model?: string
  agentName?: string
}

export const bulkUpdateAgentChats = async (
  workspaceId: string,
  projectId: string,
  filter: AgentChatBulkFilter = {},
  payload: AgentChatBulkPayload = {},
): Promise<IAgentChatDocument[]> => {
  if (isNarrowedToEmptyIdList(filter)) {
    return []
  }
  const conditions = buildAgentChatBulkConditions(workspaceId, projectId, filter)
  const updatedChats = await AgentChatModel.bulkUpdateAgentChats(conditions, payload)

  websocket.agentNamespaceHandler.emitMessageToRoom(
    workspaceId,
    projectId,
    '/',
    AgentEvents.AGENT_CHAT_BULK_UPDATE,
    {
      data: updatedChats.map(c => c.toObject()),
    } as AgentEventsMap[AgentEvents.AGENT_CHAT_BULK_UPDATE]['responseParams'],
  )

  return updatedChats
}

export const bulkRemoveAgentChats = async (
  workspaceId: string,
  projectId: string,
  filter: AgentChatBulkFilter = {},
): Promise<void> => {
  if (isNarrowedToEmptyIdList(filter)) {
    return
  }
  const conditions = buildAgentChatBulkConditions(workspaceId, projectId, filter)
  const docs = await AgentChatModel.find(conditions).select('_id agent status').lean()
  const chatObjectIds = docs.map(d => d._id)
  if (!chatObjectIds.length) {
    return
  }

  await Promise.all([
    ...chatObjectIds.map(id => AgentSessionCache.unset(id.toString())),
    ...docs
      .filter(d => d.status === AgentChatStatus.Processing || d.status === AgentChatStatus.Streaming)
      .map(d => AgentModel.releaseIssueCapacitySlot(d.agent)),
  ])

  const workspaceOid = new ObjectId(workspaceId)
  const projectOid = new ObjectId(projectId)

  const messagesWithAttachments = await AgentChatMessageModel.find({
    workspace: workspaceOid,
    project: projectOid,
    chat: { $in: chatObjectIds },
    'attachments.metadata.s3Key': { $exists: true },
  }).select('attachments').lean()

  const s3Deletions = messagesWithAttachments.flatMap(msg =>
    (msg.attachments ?? [])
      .filter((a: any) => a?.metadata?.s3Key && a?.metadata?.s3Bucket)
      .map((a: any) => s3.deleteObject(a.metadata.s3Bucket, a.metadata.s3Key)),
  )

  await Promise.all([
    AgentChatMessageModel.deleteMany({
      workspace: workspaceOid,
      project: projectOid,
      chat: { $in: chatObjectIds },
    }),
    ...s3Deletions,
  ])

  await AgentChatModel.deleteMany({ _id: { $in: chatObjectIds } })

  websocket.agentNamespaceHandler.emitMessageToRoom(
    workspaceId,
    projectId,
    '/',
    AgentEvents.AGENT_CHAT_BULK_DELETE,
    {
      _id: chatObjectIds.map(id => id.toString()),
      workspace: workspaceId,
      project: projectId,
    } as AgentEventsMap[AgentEvents.AGENT_CHAT_BULK_DELETE]['responseParams'],
  )

  const chatsByAgent = new Map<string, string[]>()
  for (const doc of docs) {
    const agentId = doc.agent?.toString()
    if (!agentId) continue
    const ids = chatsByAgent.get(agentId) ?? []
    ids.push(doc._id.toString())
    chatsByAgent.set(agentId, ids)
  }

  for (const [agentId, agentChatIds] of chatsByAgent) {
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, agentId),
      AgentEvents.AGENT_CHAT_BULK_DELETE,
      {
        _id: agentChatIds,
        workspace: workspaceId,
        project: projectId,
      } as AgentEventsMap[AgentEvents.AGENT_CHAT_BULK_DELETE]['responseParams'],
    )
  }
}

export const notifyDebuggingAgentToFixIssue = async (
  agent: IAgentDocument,
  issue: IIssueDocument | IIssue,
  startReason: AgentChatStartReasonEnum,
): Promise<IAgentChatDocument | undefined> => {
  try {
    const agentRoom = WebSocketHelper.getAgentRoomInProject(
      issue.workspace.toString(),
      issue.project.toString(),
      agent._id.toString(),
    )

    let release: IReleaseDocument | undefined

    if (
      issue.service.release
      && issue.service.serviceName
    ) {
      const component = await EntityService.getEntityByKeyInDefaultProjectBranch(
        issue.workspace.toString(),
        issue.project.toString(),
        issue.service.serviceName,
        EntityType.PLATFORM_COMPONENT,
      )

      if (component) {
        const { data: [_release] } = await ReleaseModel.findReleases(
          {
            workspace: issue.workspace.toString(),
            project: issue.project.toString(),
            entity: component.entityId,
            version: issue.service.release,
          },
          {
            limit: 1,
            skip: 0,
          },
          {
            sortKey: 'createdAt',
            sortDirection: -1,
          },
        )

        if (_release) {
          release = _release
        }
      }
    }

    const agentChat = await AgentChatModel.createAgentChat({
      workspace: issue.workspace.toString(),
      project: issue.project.toString(),
      agent: agent._id.toString(),
      type: AgentChatType.Agent,
      agentType: agent.type,
      status: AgentChatStatus.Processing,
      startReason,
      ...(agent.model ? { model: agent.model } : {}),
      title: AgentChatLib.getChatTitle({
        startReason,
        issue,
      }),
      metadata: {
        issue: {
          componentHash: issue.componentHash,
        },
        ...release ? {
          _id: release._id.toString(),
          version: release.version,
          commitHash: release.commitHash,
        }
          : {},
        ...issue.service.serviceName
          ? {
            entityId: issue.service.serviceName,
            name: issue.service.serviceName,
          }
          : {},
        ...issue.service.environment
          ? {
            name: issue.service.environment,
          }
          : undefined,
      },
    })
    const agentChatId = agentChat._id.toString()
    const workspaceId = issue.workspace.toString()
    const projectId = issue.project.toString()

    // Join agent's socket(s) to the session room
    const agentChatRoom = WebSocketHelper.getChatRoom(workspaceId, projectId, agentChatId)
    const agentSockets = await websocket.io.in(agentRoom).fetchSockets()
    for (const s of agentSockets) {
      s.join(agentChatRoom)
    }

    const project = await ProjectService.getProject(projectId)
    const issueUrl = await IssueService.getIssueUrl(issue as IIssue)

    // Send DEBUGGING_AGENT_RESOLVE_ISSUE to the agent — prompt is built on the agent side
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      agentRoom,
      AgentEvents.DEBUGGING_AGENT_RESOLVE_ISSUE,
      {
        issue: {
          ...(issue as IIssueDocument)?.toObject?.() || issue as IIssue,
          url: issueUrl,
        },
        release: release?.toObject ? release.toObject() : release as IReleaseDocument | undefined,
        chatId: agentChatId,
        sessionId: agentChatId,
        agentSettings: startReason !== AgentChatStartReasonEnum.MANUAL
          ? {
            fixabilityScoreThreshold: project?.settings?.agent?.fixabilityScoreThreshold || DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD,
          }
          : undefined,
      } as AgentEventsMap[AgentEvents.DEBUGGING_AGENT_RESOLVE_ISSUE]['responseParams'],
    )

    // Broadcast to viewers (excluding the agent) so they know a new chat started
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      '/',
      AgentEvents.AGENT_CHAT_NEW,
      {
        chatId: agentChatId,
        chat: agentChat.toJSON(),
      } as AgentEventsMap[AgentEvents.AGENT_CHAT_NEW]['responseParams'],
      agent.socketId,
    )

    await AgentSessionCache.set(agent._id.toString(), agentChatId)

    logger.info({
      agentId: agent._id.toString(),
      issueId: issue?._id?.toString(),
      issueComponentHash: issue.componentHash,
      startReason,
      agentChatId,
      agentRoom,
    }, '[AGENT_SERVICE] Notified debugging agent to fix issue')

    await IssueModel.bulkUpdateIssues(
      issue.workspace.toString(),
      issue.project.toString(),
      {
        componentHash: [issue.componentHash],
      },
      {
        solution: {
          inProgress: true,
          agent: agent._id.toString(),
        },
      },
    )

    return agentChat
  } catch (error) {
    logger.error(error, '[AGENT] Failed to notify debugging agents of new issue')
    throw error
  }
}

export const startAgentChatWithoutIssue = async (
  agent: IAgentDocument,
  ctx: {
    startedByWorkspaceUserId?: string
    debugSessionId?: string
  } = {},
): Promise<IAgentChatDocument> => {
  const { startedByWorkspaceUserId, debugSessionId } = ctx
  const workspaceId = agent.workspace.toString()
  const projectId = agent.project.toString()

  const agentChat = await AgentChatModel.createAgentChat({
    workspace: workspaceId,
    project: projectId,
    agent: agent._id.toString(),
    type: AgentChatType.Agent,
    agentType: agent.type,
    agentName: agent.name,
    status: AgentChatStatus.Finished,
    startReason: AgentChatStartReasonEnum.MANUAL,
    ...(
      agent.model
        ? { model: agent.model }
        : {}
    ),
    ...(
      startedByWorkspaceUserId
        ? { startedByWorkspaceUser: startedByWorkspaceUserId }
        : {}
    ),
    ...(
      debugSessionId
        ? { metadata: { debugSession: { _id: debugSessionId } } }
        : {}
    ),
  })

  const agentChatId = agentChat._id.toString()
  const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, agent._id.toString())
  const agentChatRoom = WebSocketHelper.getChatRoom(workspaceId, projectId, agentChatId)

  const agentSockets = await websocket.io.in(agentRoom).fetchSockets()
  for (const _agentSocket of agentSockets) {
    _agentSocket.join(agentChatRoom)
  }

  websocket.agentNamespaceHandler.emitMessageToRoom(
    workspaceId,
    projectId,
    '/',
    AgentEvents.AGENT_CHAT_NEW,
    {
      chatId: agentChatId,
      chat: agentChat.toJSON(),
    } as AgentEventsMap[AgentEvents.AGENT_CHAT_NEW]['responseParams'],
  )

  await AgentSessionCache.set(
    agent._id.toString(),
    agentChatId,
  )

  logger.info(
    {
      agentId: agent._id.toString(),
      agentChatId,
    },
    '[AGENT_SERVICE] Started agent chat without issue',
  )

  return agentChat
}

export const reassignChatToAvailableAgent = async (
  agentChat: IAgentChatDocument,
): Promise<IAgentDocument | undefined> => {
  const workspaceId = agentChat.workspace.toString()
  const projectId = agentChat.project.toString()
  const chatId = agentChat._id.toString()

  const agent = await findAgentWithAvailableSlot(
    workspaceId,
    projectId,
  )

  if (!agent) {
    logger.warn({ chatId }, '[AGENT_SERVICE] No available agent to assign chat to')
    return undefined
  }

  const agentId = agent._id.toString()

  await AgentChatModel.updateAgentChatById(
    chatId,
    {
      agent: agentId,
      status: AgentChatStatus.Processing,
      ...(agent.model ? { model: agent.model } : {}),
    },
  )
  await AgentSessionCache.set(agentId, chatId)

  const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, agentId)
  const chatRoom = WebSocketHelper.getChatRoom(workspaceId, projectId, chatId)
  const agentSockets = await websocket.io.in(agentRoom).fetchSockets()
  for (const s of agentSockets) {
    s.join(chatRoom)
  }

  websocket.agentNamespaceHandler.emitMessageToRoom(
    workspaceId,
    projectId,
    agentRoom,
    AgentEvents.AGENT_CHAT_NEW,
    {
      chatId,
      chat: agentChat.toJSON(),
    } as AgentEventsMap[AgentEvents.AGENT_CHAT_NEW]['responseParams'],
  )

  logger.info({ chatId, agentId }, '[AGENT_SERVICE] Chat assigned to agent')

  return agent
}

const getAgentSettings = async (agentId: string): Promise<{
  issueSubscription?: {
    componentName?: string[]
    environmentName?: string[]
  },
  autoResolveIssues?: boolean
  fixabilityScoreThreshold?: number
}> => {
  const agent = await AgentModel.findAgentById(agentId)

  if (!agent) {
    throw new NotFoundError(ErrorMessage.AGENT_NOT_FOUND)
  }

  const project = await ProjectService.getProject(agent.project.toString())

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }

  const settings = {
    issueSubscription: {
      componentName: agent.settings?.issueSubscription?.componentName,
      environmentName: agent.settings?.issueSubscription?.environmentName,
    },
    autoResolveIssues: agent.settings?.autoResolveIssues ?? true,
    fixabilityScoreThreshold: agent.settings?.fixabilityScoreThreshold
      ?? project.settings?.agent?.fixabilityScoreThreshold
      ?? DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD,
  }

  return settings
}

export const findAndAssignIssueToAgent = async (
  agent: IAgentDocument,
  startReason: AgentChatStartReasonEnum,
): Promise<void> => {
  try {
    const agentSettings = await getAgentSettings(agent._id.toString())

    if (!agentSettings.autoResolveIssues) {
      return
    }

    const { data: otelIntegrations } = await IntegrationModel.findIntegrations({
      workspace: agent.workspace,
      project: agent.project,
      type: IntegrationTypeEnum.OTEL,
      workspaceUser: agent.workspaceUser,
      otelAgentSelectionMode: OtelAgentSelectionMode.ONLY_MY_AGENT,
    })

    const issue = await IssueModel.findIssueWithoutSolution({
      workspace: agent.workspace,
      project: agent.project,
      componentName: agent.settings?.issueSubscription?.componentName,
      environmentName: agent.settings?.issueSubscription?.environmentName,
      ...(
        otelIntegrations
          ? { integration: otelIntegrations.map(i => i._id.toString()) }
          : {}
      ),
    })

    if (!issue) {
      logger.debug({ startReason }, '[AGENT_SERVICE] No issue to fix')
      return
    }

    if (issue.integration) {
      const issueIntegration = await IntegrationModel.findIntegrationById(issue.integration)
      if (issueIntegration?.otel?.autoResolveIssues === false) {
        return
      }
    }

    const issueLockKey = `${REDIS_ISSUE_RESOLVE_LOCK_PREFIX}${issue._id.toString()}`
    const issueLocked = await redis.lockKey(issueLockKey, REDIS_ISSUE_RESOLVE_LOCK_TTL)

    if (!issueLocked) {
      return
    }

    await notifyDebuggingAgentToFixIssue(agent, issue, startReason)
  } catch (error) {
    logger.error(error, '[AGENT_SERVICE] Failed to find and assign issue to agent')
  }
}

export const disconnectAgent = async (agent: IAgentDocument): Promise<void> => {
  await AgentModel.deleteAgentById(agent._id)
  await IssueModel.bulkUpdateIssues(
    agent.workspace,
    agent.project,
    {
      solutionAgent: agent._id,
    },
    {
      solution: {
        inProgress: false,
        fixWithAgentFailed: false,
        agent: undefined,
      },
    },
  )
  await AgentSessionCache.unsetByAgent(agent._id.toString())

  websocket.agentNamespaceHandler.emitMessageToRoom(
    agent.workspace,
    agent.project,
    '/',
    AgentEvents.AGENT_DISCONNECTED,
    {
      _id: agent._id,
    },
  )

  await websocket.agentNamespaceHandler.disconnectAgentSockets(agent)
}

export const getAgentByChatId = async (chatId: string): Promise<IAgentDocument | undefined> => {
  const agentId = await AgentSessionCache.getByChat(chatId)
  if (!agentId) {
    await AgentSessionCache.unset(chatId)
    return undefined
  }

  const agent = await AgentModel.findAgentById(agentId)
  if (!agent) {
    await AgentSessionCache.unsetByAgent(agentId)
    return undefined
  }

  return agent
}

export const updateAgentById = async (
  workspaceId: string,
  projectId: string,
  agentId: string,
  update: Partial<IAgent>,
): Promise<IAgentDocument> => {
  const updatedAgent = await AgentModel.updateAgentById(
    workspaceId,
    projectId,
    agentId,
    update,
  )
  if (!updatedAgent) {
    throw new NotFoundError(ErrorMessage.AGENT_NOT_FOUND)
  }

  websocket.agentNamespaceHandler.emitMessageToRoom(
    workspaceId,
    projectId,
    '/',
    AgentEvents.DEBUGGING_AGENT_UPDATE,
    updatedAgent.toObject() as AgentEventsMap[AgentEvents.DEBUGGING_AGENT_UPDATE]['responseParams'],
  )

  return updatedAgent
}


export const shouldAutoResolveIssue = async (
  projectId: string,
  integrationId?: string,
): Promise<boolean> => {
  if (integrationId) {
    const integration = await IntegrationModel.findIntegrationById(integrationId)
    if (integration?.otel?.autoResolveIssues === false) {
      return false
    }
  }

  return true
}


export const findAgentWithAvailableSlot = async (
  workspaceId: string,
  projectId: string,
  filter: {
    integration?: ObjectId | string,
    componentName?: string,
    environmentName?: string,
  } = {},
): Promise<IAgentDocument | null> => {
  let onlyMyAgent = false
  let workspaceUser: string | undefined = undefined

  if (filter.integration) {
    const integration = await IntegrationModel.findIntegrationById(filter.integration)

    if (integration) {
      onlyMyAgent = integration.otel?.agentSelectionMode === OtelAgentSelectionMode.ONLY_MY_AGENT
      workspaceUser = integration.workspaceUser.toString()
    }
  }


  let attempt = 0
  let agent: IAgentDocument | null = null

  while (attempt < MAX_AGENT_CHAT_ASSIGN_ATTEMPTS) {
    agent = await AgentModel.findAgentWithAvailableSlot({
      workspaceId,
      projectId,
      componentName: filter.componentName,
      environmentName: filter.environmentName,
      ...onlyMyAgent ? { workspaceUser } : {},
    })

    if (agent) {
      const isAgentConnected = await websocket.agentNamespaceHandler.isAgentConnected(agent)
      if (isAgentConnected) {
        break
      }

      logger.warn(
        {
          agentId: agent._id.toString(),
          socketId: agent.socketId,
        },
        '[AGENT_SERVICE] Found an agent with available slot but it is not connected. Removing stuck agent and trying to find another one.',
      )
      await AgentModel.releaseIssueCapacitySlot(agent._id)
      await disconnectAgent(agent)
    }

    attempt++

    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
    if (attempt < MAX_AGENT_CHAT_ASSIGN_ATTEMPTS) {
      await new Promise(r => setTimeout(r, Math.min(100 * 2 ** (attempt - 1), 2000)))
    }
  }

  if (!agent) {
    logger.warn({
      filter,
    }, '[AGENT_SERVICE] No available agent')
    return null
  }

  return agent
}
