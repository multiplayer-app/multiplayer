import { NotFoundError } from 'restify-errors'
import { ProjectBranchModel } from '@multiplayer/models'
import {
  DefaultProjectBranchCache,
  ProjectBranchCache,
} from '../cache'

export const getDefaultProjectBranchIdByProjectId = async (projectId: string): Promise<string> => {
  let defaultProjectBranchId = DefaultProjectBranchCache.get(projectId) as string

  if (defaultProjectBranchId) {
    return defaultProjectBranchId as string
  }

  const projectBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

  if (!projectBranch) {
    throw new NotFoundError(`Default Project-Branch for project with id ${projectId} not found`)
  }

  defaultProjectBranchId = projectBranch._id.toString()

  DefaultProjectBranchCache.set(projectId, defaultProjectBranchId)

  return defaultProjectBranchId
}

export const getProjectIdByBranchById = async (projectBranchId: string): Promise<string | undefined> => {
  let projectId = ProjectBranchCache.get(projectBranchId) as string

  if (projectId) {
    return projectId as string
  }

  const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)

  if (!projectBranch) {
    return undefined
  }

  projectId = projectBranch.project.toString()

  ProjectBranchCache.set(projectBranchId, projectId)

  return projectId
}
