import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string

    await TeamModel.deleteTeamById(teamId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
