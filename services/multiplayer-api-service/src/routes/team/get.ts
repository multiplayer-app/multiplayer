import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string

    const team = await TeamModel.findTeamById(teamId)

    return res.status(200).json(team)
  } catch (err) {
    return next(err)
  }
}
