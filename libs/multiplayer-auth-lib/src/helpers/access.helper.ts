import { ProjectModel, WorkspaceModel } from '@multiplayer/models'
import { IAccess } from '@multiplayer/types'
import { AccessCache } from '../cache'

export const get = async ({
  workspaceId,
  projectId,
}: { workspaceId?: string, projectId?: string }): Promise<IAccess | undefined> => {
  if (!workspaceId && !projectId) {
    throw new Error('Failed to get access')
  }

  const id = (projectId || workspaceId) as string

  const cachedAccess = await AccessCache.get(id)

  if (cachedAccess) {
    return cachedAccess as unknown as IAccess
  }

  let access: IAccess | undefined

  if (projectId) {
    const project = await ProjectModel.findProjectById(projectId)

    access = project?.access
  } else if (workspaceId) {
    const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

    access = workspace?.access
  }

  if (access) {
    await AccessCache.set(
      id,
      access,
    )
  }

  return access
}
