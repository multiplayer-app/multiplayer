import {
  BranchDeletedMessage,
  CollaborationAMQPMessageType,
  EntityCommitMessage,
  EntityCreatedMessage, EntityDeletedMessage,
} from '@multiplayer/types'
import { AMQP_AI_EVENT_QUEUE, AMQP_EVENT_QUEUE } from './config'
import AMQP from '@multiplayer/amqp'
import { AssistantController } from './lib/assistant'

export class AMQPListener {
  static async processEventMessage(type: CollaborationAMQPMessageType, data: any) {
    if (type === CollaborationAMQPMessageType.ENTITY_CREATE) {
      const message: EntityCreatedMessage = data
      await AssistantController.createVectorData({
        workspaceId: message.entity.workspace,
        projectId: message.entity.project,
        branchId: message.entity.projectBranch,
        entityId: message.entity.entityId,
      })
      return
    }
    if (type === CollaborationAMQPMessageType.ENTITY_COMMIT_CREATED) {
      const message: EntityCommitMessage = data
      await AssistantController.createVectorData({
        workspaceId: message.workspaceId,
        projectId: message.projectId,
        branchId: message.branchId,
        entityId: message.entityId,
      })
      return
    }
    if (type === CollaborationAMQPMessageType.ENTITY_DELETE) {
      const message: EntityDeletedMessage = data
      await AssistantController.deleteVectorData({
        workspaceId: message.workspaceId,
        projectId: message.projectId,
        branchId: message.branchId,
        entityId: message.entityId,
      })
    }
    if (type === CollaborationAMQPMessageType.BRANCH_DELETE) {
      const message: BranchDeletedMessage = data
      await AssistantController.deleteVectorData({
        workspaceId: message.workspaceId,
        projectId: message.projectId,
        branchId: message.branchId,
      })
      return
    }
  }

  static disconnect() {
    return AMQP.disconnect()
  }

  static async connect() {
    await AMQP.connect()
    await AMQP.bindQueue(
      AMQP_AI_EVENT_QUEUE,
      AMQP_EVENT_QUEUE,
      { durable: true },
    )

    await AMQP.listen(
      AMQP_AI_EVENT_QUEUE,
      async (message: {
        type: string
        variables: unknown
      }) => {
        if (
          !message.type
          || !CollaborationAMQPMessageType[message.type]
        ) {
          return
        }

        await AMQPListener.processEventMessage(
          CollaborationAMQPMessageType[message.type],
          message.variables,
        )
      },
      {
        durable: true,
        prefetch: 3,
      },
    )
  }
}
