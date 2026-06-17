import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string

    const teamProjects = await TeamModel.listProjects(teamId)

    return res.status(200).json(teamProjects)
  } catch (err) {
    return next(err)
  }
}
