import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { ForbiddenError, NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const workspaceId = req.params.workspaceId as string
    const project = await ProjectModel.findProjectById(projectId)

    if (!project) {
      return next(new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND))
    }
    if (!project.workspace.equals(workspaceId)) {
      return next(new ForbiddenError(ErrorMessage.NO_ACCESS_TO_THE_RESOURCE))
    }

    req.project = project

    next()
  } catch (err) {
    next(err)
  }
}
