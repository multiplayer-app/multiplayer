import { NextFunction, Request, Response } from 'express'
import { GitRepositoryModel } from '@multiplayer/models'
import { ForbiddenError, NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const checkGitRepositoryAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRepositoryId = req.params.gitRepositoryId as string

    if (!req.projectBranch || req.projectBranch.default) {
      return next(new ForbiddenError(ErrorMessage.NON_DEFAULT_BRANCH_ONLY))
    }
    const repo = await GitRepositoryModel.findGitRepositoryById(gitRepositoryId)

    if (!repo || !repo.project.equals(req.projectBranch.project)) {
      return next(new NotFoundError(ErrorMessage.GIT_REPOSITORY_NOT_FOUND))
    }
    next()
  } catch (err) {
    next(err)
  }
}
