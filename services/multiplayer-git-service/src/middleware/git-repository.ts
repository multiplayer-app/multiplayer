import type { Request, Response, NextFunction } from 'express'
import { GitRepositoryLib } from '../libs'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachGitRepository = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRepositoryId = req.params.gitRepositoryId as string

    const gitRepository = await GitRepositoryLib.fetchGitRepositoryById(
      gitRepositoryId,
    )

    if (!gitRepository) {
      return next(new NotFoundError(ErrorMessage.GIT_REPOSITORY_NOT_FOUND))
    }
    req.gitRepository = gitRepository

    next()
  } catch (error) {
    next(error)
  }
}

export const attachGitRepositoryByGitId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const gitId = req.params.gitId as string

    const gitRepository = await GitRepositoryLib.fetchGitRepositoryByGitId(
      workspaceId,
      projectId,
      gitId,
    )

    if (!gitRepository) {
      return next(new NotFoundError(ErrorMessage.GIT_REPOSITORY_NOT_FOUND))
    }
    req.gitRepository = gitRepository

    next()
  } catch (error) {
    next(error)
  }
}
