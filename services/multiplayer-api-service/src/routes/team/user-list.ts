import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const teamMembers = await TeamModel.listUsers(
      teamId,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(teamMembers)
  } catch (err) {
    return next(err)
  }
}
