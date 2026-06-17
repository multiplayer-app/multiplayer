import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { AccessControlContext } from '@multiplayer/auth'
import {
  WorkspaceModel,
  WorkspaceUserModel,
  TeamModel,
  ProjectModel,
} from '@multiplayer/models'
import { ErrorMessage, WorkspaceUserStatus } from '@multiplayer/types'
import { BillingService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const workspaceMemberId = req.params.workspaceMemberId as string

    const [workspaceMember] = await WorkspaceModel.getWorkspaceMembersByWorkspaceMemberIds(
      workspaceId,
      [(workspaceMemberId as string)],
    )

    await WorkspaceModel.removeUser(
      workspaceId,
      workspaceMemberId,
    )

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(
      (workspaceMember.workspaceUser as string),
    )

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    await WorkspaceUserModel.updateWorkspaceUser(
      workspaceUser.user,
      workspaceId,
      {
        status: WorkspaceUserStatus.NOT_ACTIVE,
      },
    )

    await TeamModel.removeUserFromAllWorkspaceTeams(
      workspaceId,
      workspaceUser._id,
    )

    await ProjectModel.removeUserFromAllWorkspaceProjects(
      workspaceId,
      workspaceUser._id,
    )

    await AccessControlContext.invalidateContext({
      workspaceId,
      userId: workspaceUser.user.toString(),
    })

    await BillingService.updateSubscriptionOnUserRemoved(workspaceId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
