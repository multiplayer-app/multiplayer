import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  TeamModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { ErrorMessage, RoleType } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'
import { RoleLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const teamId = req.params.teamId as string
    const teamUserId = req.params.teamUserId as string
    const payload = req.body

    if (payload.role) {
      await RoleLib.fetchRoleById(payload.role, RoleType.PROJECT)
    }

    const updatedTeamMember = await TeamModel.updateUser(teamId, teamUserId, payload)

    if (!updatedTeamMember) {
      return res.sendStatus(404)
    }

    const [teamMember] = await TeamModel.getTeamMembersByWorkspaceUserIds(
      teamId,
      [updatedTeamMember.workspaceUser as string],
    )

    const workspaceUser = await WorkspaceUserModel
      .findWorkspaceUserById(updatedTeamMember.workspaceUser as string)

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    await AccessControlContext.invalidateContext({
      userId: workspaceUser.user.toString(),
      workspaceId,
    })

    return res.status(200).json(teamMember)
  } catch (err) {
    return next(err)
  }
}
