import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'
import { MongoPayload } from '@multiplayer/util'

export default async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      archived,
      status,
      name,
      default: showDefaultBranch,
    } = req.query
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: any = {
      project: projectId,
      workspace: workspaceId,
      archived,
      name,
      status,
      default: showDefaultBranch,
    }

    const branches = await ProjectBranchModel.findProjectBranches(
      MongoPayload.removeUndefinedProps(filter),
      {
        skip,
        limit,
      },
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(branches)
  } catch (err) {
    return next(err)
  }
}
