import { NotFoundError } from 'restify-errors'
import { Types } from 'mongoose'
import {
  WorkspaceModel,
  IWorkspaceDocument,
} from '@multiplayer/models'

export const getWorkspaceById = async (
  workspaceId: string | Types.ObjectId,
): Promise<IWorkspaceDocument> => {
  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  if (!workspace) {
    throw new NotFoundError('Workspace not found')
  }

  return workspace
}
