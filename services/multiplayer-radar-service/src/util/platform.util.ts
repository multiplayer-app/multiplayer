import { Y } from '@multiplayer/entity'
import { InternalCollaborationService } from '../services'

export const getPlatform = async (
  workspaceId: string,
  projectId: string,
  branchId: string,
  entityId: string,
): Promise<Y.Doc> => {
  const collaborationService = new InternalCollaborationService()
  const platformState = await collaborationService.getEntityState({
    workspaceId,
    projectId,
    branchId,
    entityId,
  })

  const platformDoc = new Y.Doc()
  Y.applyUpdate(platformDoc, new Uint8Array(platformState.state))

  return platformDoc
}
