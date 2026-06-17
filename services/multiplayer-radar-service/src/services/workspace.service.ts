import { NotFoundError } from 'restify-errors'
import { FeatureFlag, ErrorMessage } from '@multiplayer/types'
import { WorkspaceModel } from '@multiplayer/models'
import { WorkspaceFeatureCache } from '../cache'

export const isFeatureFlagEnabled = async (workspaceId: string, feature: FeatureFlag): Promise<boolean> => {
  const featureEnabled = WorkspaceFeatureCache.get(workspaceId, feature)

  if (typeof featureEnabled === 'boolean') {
    return featureEnabled
  }

  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  if (!workspace) {
    throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
  } else {
    WorkspaceFeatureCache.set(
      workspaceId,
      feature,
      workspace.featureFlags[feature] === true,
    )

    return workspace.featureFlags[feature] === true as boolean
  }
}
