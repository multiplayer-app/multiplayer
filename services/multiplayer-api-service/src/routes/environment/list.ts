import type { Request, Response, NextFunction } from 'express'
import { MongoPayload } from '@multiplayer/util'
import {
  IEnvironment,
} from '@multiplayer/types'
import { EnvironmentStateLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string

    const cursor: any = {
      skip,
      limit,
    }

    const filter: Partial<IEnvironment> & {
      archived?: boolean,
    } = {
      workspace: workspaceId,
      project: projectId,
      archived,
    }

    const environments = await EnvironmentStateLib.getEnvironmentState(
      projectBranchId,
      MongoPayload.removeUndefinedProps(filter),
      cursor,
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(environments)
  } catch (err) {
    return next(err)
  }
}
