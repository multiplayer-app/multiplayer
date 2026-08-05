import type { Request, Response, NextFunction } from 'express'
import {
  ProjectModel,
} from '@multiplayer/models'
import {
  InternalServerError,
  NotFoundError,
} from 'restify-errors'
import { ProjectLib } from '../lib'
import { ErrorMessage } from '@multiplayer/types'

export const attachProjectByProjectBranch = async (req: Request, res: Response, next: NextFunction) => {
  const { projectBranch } = req

  if (!projectBranch) {
    return next(new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
  }

  const project = await ProjectModel.findProjectById(projectBranch.project)

  if (!project) {
    return next(new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND))
  }

  req.project = project

  next()
}

export const attachProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const project = await ProjectLib.getProjectById(projectId)

    if (!project) {
      return next(new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND))
    }
    req.project = project

    next()
  } catch (error) {
    next(error)
  }
}
