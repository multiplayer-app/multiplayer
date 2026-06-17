import AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import {
  BranchDeletedMessage,
  CollaborationAMQPMessageType,
  CollaborationRPCMessageType,
  CommentCreatedMessage,
  EntityCommitMessage,
  EntityCreatedMessage,
  EntityDeletedMessage,
  EntityUpdatedMessage,
  GetEntityStateRequest,
  GetEntityStateResponse,
  ThreadCreatedMessage,
  UpdateEntityStateRequest,
} from '@multiplayer/types'
import { YjsEntitiesSocketIO } from './yjs/yjs-entities-socket-io'
import { ProjectNamespaceHandler } from './handlers/project.handlers'
import {
  AMQP_COLLABORATION_EVENT_QUEUE,
  AMQP_EVENT_QUEUE,
  AMQP_COLLABORATION_RPC_QUEUE,
} from './config'

export class AMQPListener {
  private yjsIOs: YjsEntitiesSocketIO
  private projectIO: ProjectNamespaceHandler
  constructor(yjsIOs: YjsEntitiesSocketIO, projectIO: ProjectNamespaceHandler) {
    this.yjsIOs = yjsIOs
    this.projectIO = projectIO
  }

  async processEventMessage(type: CollaborationAMQPMessageType, data: any) {
    if (type === CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED) {
      const { entityId, branchId, projectId, isDefaultBranch, entityCommit } = data as EntityCommitMessage
      this.projectIO.onEntityCommit({ entityId, branchId, projectId, entityCommit })
      if (isDefaultBranch) {
        //todo
        await this.yjsIOs.refreshDependentDocs(entityId, branchId, projectId)
      }
      return
    }
    if (type === CollaborationAMQPMessageType.ENTITY_CREATE) {
      this.projectIO.onEntityCreated(data as EntityCreatedMessage)
      return
    }
    if (type === CollaborationAMQPMessageType.BRANCH_DELETE) {
      this.projectIO.onBranchDelete(data as BranchDeletedMessage)
      return
    }
    if (type === CollaborationAMQPMessageType.ENTITY_DELETE) {
      this.yjsIOs.destroyEntity(data as EntityDeletedMessage)
      this.projectIO.onEntityDelete(data as EntityDeletedMessage)
      return
    }
    if (type === CollaborationAMQPMessageType.ENTITY_UPDATE) {
      const message = data as EntityUpdatedMessage
      this.projectIO.onEntityUpdate(message)
      this.yjsIOs.onEntityUpdate(message)
      return
    }
    if (type === CollaborationAMQPMessageType.THREAD_CREATE) {
      const message = data as ThreadCreatedMessage
      this.projectIO.onThreadCreated(message)
      return
    }
    if (type === CollaborationAMQPMessageType.COMMENT_CREATE) {
      const message = data as CommentCreatedMessage
      this.projectIO.onCommentCreated(message)
      return
    }
  }

  async processRpcRequest(type: CollaborationRPCMessageType, data: any): Promise<unknown> {
    if (type === CollaborationRPCMessageType.GET_ENTITY_STATE) {
      const state = await this.yjsIOs.getEntityState(data as GetEntityStateRequest)
      const response: GetEntityStateResponse = { state: Object.values(state) }
      return response
    }
    if (type === CollaborationRPCMessageType.UPDATE_ENTITY_STATE) {
      const message = data as UpdateEntityStateRequest
      await this.yjsIOs.updateEntityStateAndCommit(message)
      return undefined
    }

    return null
  }

  disconnect() {
    return AMQP.disconnect()
  }

  async connect() {
    await AMQP.connect()
    await AMQP.bindQueue(
      AMQP_COLLABORATION_EVENT_QUEUE,
      AMQP_EVENT_QUEUE,
      { durable: true },
    )

    await AMQP.listen(
      AMQP_COLLABORATION_EVENT_QUEUE,
      async (message: {
        type: string
        variables: unknown
      }) => {
        if (
          !message.type
          || !CollaborationAMQPMessageType[message.type]
        ) {
          logger.debug('Unknown amqp message type', message.type)
          return
        }

        await this.processEventMessage(
          CollaborationAMQPMessageType[message.type],
          message.variables,
        )
      },
      {
        durable: true,
        prefetch: 10,
      },
    )

    await AMQP.listen(
      AMQP_COLLABORATION_RPC_QUEUE,
      async (message: {
        type: string
        variables: unknown
      }) => {
        return this.processRpcRequest(
          CollaborationRPCMessageType[message.type],
          message.variables,
        )
      },
      { durable: false },
    )
  }
}
