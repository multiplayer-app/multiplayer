import AMQP from '@multiplayer/amqp'
import {
  CollaborationRPCMessageType,
  GetEntityStateRequest,
} from '@multiplayer/types'
import { Y } from '@multiplayer/entity'
import { AMQP_COLLABORATION_RPC_QUEUE } from '../config'

export const getPlatform = async (
  workspaceId: string,
  projectId: string,
  branchId: string,
  entityId: string,
): Promise<Y.Doc> => {
  const platformState = await AMQP.request(
    AMQP_COLLABORATION_RPC_QUEUE,
    {
      type: CollaborationRPCMessageType.GET_ENTITY_STATE,
      variables: {
        workspaceId,
        projectId,
        branchId,
        entityId,
      } as GetEntityStateRequest,
    },
  ) as any

  const platformDoc = new Y.Doc()
  Y.applyUpdate(platformDoc, new Uint8Array(platformState.state))

  return platformDoc
}
