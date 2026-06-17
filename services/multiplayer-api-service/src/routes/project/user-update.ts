import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  ProjectModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { ErrorMessage, RoleType } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'
import { RoleLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectUserId = req.params.projectUserId as string
    const payload = req.body

    if (payload.role) {
      await RoleLib.fetchRoleById(payload.role, RoleType.PROJECT)
    }

    const updatedProjectMember = await ProjectModel.updateUser(
      projectId,
      projectUserId,
      payload,
    )

    if (!updatedProjectMember) {
      return res.sendStatus(404)
    }

    const [projectUser] = await ProjectModel.getProjectUsersByProjectUserIds(
      projectId,
      [updatedProjectMember.workspaceUser as string],
    )

    const workspaceUser = await WorkspaceUserModel
      .findWorkspaceUserById(updatedProjectMember.workspaceUser as string)

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    await AccessControlContext.invalidateContext({
      userId: workspaceUser.user.toString(),
      workspaceId,
    })

    return res.status(200).json(projectUser)
  } catch (err) {
    return next(err)
  }
}
