import AMQP from '@multiplayer/amqp'
import {
  CollaborationRPCMessageType,
  EntityType,
} from '@multiplayer/types'
import {
  AMQP_COLLABORATION_RPC_QUEUE,
  AMQP_RADAR_DETECTION_APPLY_QUEUE,
  AMQP_EVENT_QUEUE,
  AMQP_RADAR_EVENT_QUEUE,
  AMQP_DEBUG_SESSION_MOVE_S3_QUEUE,
} from './config'
import {
  AutoApplyDetection,
  DebugSessionWorker,
  eventListener,
} from './worker'

export const init = async () => {
  await AMQP.connect()

  await AMQP.bindQueue(
    AMQP_RADAR_EVENT_QUEUE,
    AMQP_EVENT_QUEUE,
    { durable: true },
  )

  await AMQP.listen(
    AMQP_RADAR_DETECTION_APPLY_QUEUE,
    AutoApplyDetection.autoApplyDetectionQueueListener,
    {
      durable: false,
      prefetch: 1,
    },
  )

  await AMQP.listen(
    AMQP_RADAR_EVENT_QUEUE,
    async (message: {
      type: string
      variables: unknown
    }) => {
      await eventListener(message)
    },
    {
      durable: true,
      prefetch: 3,
    },
  )

  await AMQP.listen(
    AMQP_DEBUG_SESSION_MOVE_S3_QUEUE,
    DebugSessionWorker.moveDebugSessionDataFromChToS3,
    {
      durable: false,
      prefetch: 3,
    },
  )
}

export const shareEntityUpdate = async (params: {
  workspaceId: string,
  projectId: string,
  entityId: string,
  update: Uint8Array,
  branchId: string,
  entityType: EntityType,
  workspaceUserId?: string,
}): Promise<void> => {
  await AMQP.request(
    AMQP_COLLABORATION_RPC_QUEUE,
    {
      type: CollaborationRPCMessageType.UPDATE_ENTITY_STATE,
      variables: {
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        branchId: params.branchId,
        entityId: params.entityId,
        state: Object.values(params.update),
        workspaceUserId: params.workspaceUserId,
        entityType: params.entityType,
      },
    },
  )
}
