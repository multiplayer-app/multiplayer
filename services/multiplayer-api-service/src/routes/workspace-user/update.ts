import type { Request, Response, NextFunction } from 'express'
import {
  WorkspaceModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { ErrorMessage, RoleType } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError } from 'restify-errors'
import { RoleLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const workspaceMemberId = req.params.workspaceMemberId as string
    const payload = req.body

    if (payload.role) {
      await RoleLib.fetchRoleById(payload.role, RoleType.WORKSPACE)
    }

    const updatedWorkspaceMember = await WorkspaceModel.updateUser(workspaceId, workspaceMemberId, payload)

    if (!updatedWorkspaceMember) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_MEMBER_NOT_FOUND)
    }

    const [workspaceMember] = await WorkspaceModel.getWorkspaceMembersByWorkspaceUserIds(
      workspaceId,
      [updatedWorkspaceMember.workspaceUser as string],
    )

    const workspaceUser = await WorkspaceUserModel
      .findWorkspaceUserById(workspaceMember.workspaceUser as string)

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    await AccessControlContext.invalidateContext({
      workspaceId,
      userId: workspaceUser.user.toString(),
    })

    return res.status(200).json(workspaceMember)
  } catch (err) {
    return next(err)
  }
}
