import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'
import { MongoPayload } from '@multiplayer/util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string
    const commit = req.query.commit as string
    const name = req.query.name as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const namedOnly = !!req.query.namedOnly

    const filter: {
      commit?: string,
      name?: string
    } = MongoPayload.removeUndefinedProps({
      commit,
      name: name ? name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'): undefined,
    })


    const entityCommits = await EntityCommitModel.findEntityCommits(
      {
        ...filter,
        entity: entityId,
        projectBranch: projectBranchId,
        committedOnly: true,
        namedOnly: namedOnly,
      },
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(entityCommits)
  } catch (err) {
    return next(err)
  }
}
