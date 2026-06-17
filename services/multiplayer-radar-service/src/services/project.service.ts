import { IProject } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { ProjectModel } from '@multiplayer/models'
import { ProjectCache } from '../cache'

export const getProject = async (projectId: string): Promise<IProject> => {
  let project: IProject | undefined = await ProjectCache.get(projectId)


  if (!project) {
    project = (await ProjectModel.findProjectById(projectId))?.toObject()
  }

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }


  await ProjectCache.set(
    projectId,
    project,
  )

  return project
}

export const invalidateProjectCache = async (projectId: string) => {
  await ProjectCache.del(projectId)
}
