import { WorkspaceUserModel } from '@multiplayer/models'
import { WorkspaceUserIdCache } from '../cache'

export const getWorkspaceUserId = async (
  userId: string,
  workspaceId: string,
): Promise<string | undefined> => {
  const cachedWorkspaceUserId = await WorkspaceUserIdCache.get(
    userId,
    workspaceId,
  )

  if (cachedWorkspaceUserId) {
    return cachedWorkspaceUserId
  }

  const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
    userId,
    workspaceId,
  )

  if (!workspaceUser) {
    return undefined
  }

  const workspaceUserId = workspaceUser._id.toString()

  await WorkspaceUserIdCache.set(
    userId,
    workspaceId,
    workspaceUserId,
  )

  return workspaceUserId
}
