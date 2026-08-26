import { NextFunction, Request, Response } from 'express'
import { GitRepositoryModel } from '@multiplayer/models'
import { ForbiddenError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const gitRepositoryId = req.params.gitRepositoryId as string

    const gitRepo = await GitRepositoryModel.findGitRepositoryById(gitRepositoryId)

    if (!gitRepo?.project.equals(projectId)) {
      return next(new ForbiddenError(ErrorMessage.NO_ACCESS_TO_THE_RESOURCE))
    }

    next()
  } catch (err) {
    next(err)
  }
}
