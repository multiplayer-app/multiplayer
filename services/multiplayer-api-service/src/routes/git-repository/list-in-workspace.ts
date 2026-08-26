import type { Request, Response, NextFunction } from 'express'
import {
  GitRepositoryModel,
  Config as MongoConfig,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const {
      archived,
      integration,
    } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : MongoConfig.SKIP
    const limit = 'limit' in req.query ? Number(req.query.limit) : MongoConfig.LIMIT

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
