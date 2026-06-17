import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'
import type { ObjectId } from '@multiplayer/mongo'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const context = req.context
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: {
      _id?: ObjectId[] | string[]
      archived: boolean
      workspaceUsers?: ObjectId[]
    } = {
      archived,
    }

    if (
      !context?.workspaceAdmin
      && !context?.workspaceOwner
    ) {
      filter._id = context.teams.map(({ teamId }) => teamId)
    }

    const teams = await TeamModel.findTeams(
      workspaceId,
      filter,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(teams)
  } catch (err) {
    return next(err)
  }
}
