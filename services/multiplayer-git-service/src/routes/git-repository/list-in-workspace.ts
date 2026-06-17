import type { Request, Response, NextFunction } from 'express'
import { GitRepositoryModel } from '@multiplayer/models'
import { DEFAULT_SKIP, DEFAULT_LIMIT } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const {
      archived,
      integration,
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : DEFAULT_SKIP
    const limit = 'limit' in req.query? Number(req.query.limit) : DEFAULT_LIMIT

    const filter: any = {
      archived,
      integration,
      workspace: workspaceId,
    }

    const gitRepositories = await GitRepositoryModel.findGitRepositories(
      filter,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(gitRepositories)
  } catch (err) {
    return next(err)
  }
}
