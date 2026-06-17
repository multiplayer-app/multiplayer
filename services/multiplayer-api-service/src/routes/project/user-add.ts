import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'
import { IWorkspaceUser } from '@multiplayer/types'
import { UserLib } from '../../lib'
import { BillingService } from '../../services'

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentWorkspaceUserId = req.context.workspaceUserId
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const payload = req.body

    const workspaceMember = await UserLib.inviteUser(
      currentWorkspaceUserId as string,
      payload.email,
      workspaceId,
      [],
      undefined,
      payload.role,
      true,
    )

    const [projectMember] = await ProjectModel.addUsers(
      projectId,
      [(workspaceMember.workspaceUser as IWorkspaceUser)._id],
      payload.role,
    )

    await AccessControlContext.invalidateContext({
      workspaceId: workspaceId.toString(),
      userId: (workspaceMember.workspaceUser as any).user._id.toString(),
    })

    await BillingService.updateSubscriptionOnUserAdded(workspaceId)

    return res.status(200).json(projectMember)
  } catch (err) {
    return next(err)
  }
}
