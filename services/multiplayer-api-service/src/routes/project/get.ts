import type { Request, Response, NextFunction } from 'express'
import { ProjectModel, WorkspaceModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const project = await ProjectModel.findProjectById(projectId)

    if (!project) {
      throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
    }

    const workspace = await WorkspaceModel.findWorkspaceById(project.workspace)

    if (!workspace) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
    }

    const projectObject = project.toObject()

    projectObject.access = {
      ...(projectObject.access || {}),
      permissions: req.access.permissions,
    }

    projectObject.access.guest = {
      ...(projectObject.access?.guest || {}),
      enabled: projectObject.access?.guest?.enabled || false,
    }

    projectObject.featureFlags = workspace.featureFlags || {}

    return res.status(200).json(projectObject)
  } catch (err) {
    return next(err)
  }
}
