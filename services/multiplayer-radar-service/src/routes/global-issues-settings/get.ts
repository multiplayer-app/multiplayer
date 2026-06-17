import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const project = await ProjectModel.findProjectById(projectId)

    if (!project) {
      throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
    }

    const projectObject = project.toObject()

    return res.status(200).json(projectObject.settings?.issue || {})
  } catch (err) {
    return next(err)
  }
}
