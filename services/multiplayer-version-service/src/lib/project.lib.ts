import { NotFoundError } from 'restify-errors'
import { Types } from 'mongoose'
import {
  ProjectModel,
  IProjectDocument,
} from '@multiplayer/models'

export const getProjectById = async (
  projectId: string | Types.ObjectId,
): Promise<IProjectDocument> => {
  const project = await ProjectModel.findProjectById(projectId)

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  return project
}
