import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachTeam = async (req: Request, res: Response, next: NextFunction) => {
  const teamId = req.params.teamId as string

  const team = await TeamModel.findTeamById(teamId)

  if (!team) {
    return next(new NotFoundError(ErrorMessage.TEAM_NOT_FOUND))
  }

  req.team = team

  next()
}
