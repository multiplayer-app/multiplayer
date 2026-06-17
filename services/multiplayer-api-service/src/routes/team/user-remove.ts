import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { TeamModel } from '@multiplayer/models'
import { ErrorMessage, IUser } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const teamId = req.params.teamId as string
    const teamUserId = req.params.teamUserId as string

    const [teamMember] = await TeamModel.getTeamMembersByTeamMemberIds(
      teamId,
      [teamUserId],
    )

    if (!teamMember) {
      throw new NotFoundError(ErrorMessage.TEAM_MEMBER_NOT_FOUND)
    }

    await TeamModel.removeUser(teamId, teamUserId)

    const userId = ((teamMember.workspaceUser as any).user as IUser)._id

    await AccessControlContext.invalidateContext({
      workspaceId,
      userId: userId.toString(),
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
