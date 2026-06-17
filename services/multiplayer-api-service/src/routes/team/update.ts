import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string
    const payload = req.body

    const team = await TeamModel.updateTeamById(teamId, payload)

    return res.status(200).json(team)
  } catch (err) {
    return next(err)
  }
}
