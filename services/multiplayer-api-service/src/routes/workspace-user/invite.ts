import type { Request, Response, NextFunction } from 'express'
import { IWorkspaceUserDocument } from '@multiplayer/models'
import { UserLib } from '../../lib'
import { BillingService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentWorkspaceUser = req.workspaceUser as IWorkspaceUserDocument

    const workspaceId = req.params.workspaceId as string
    const {
      sendEmail,
      emails,
      teams,
      role,
      teamRole,
      addToWorkspace,
    } = req.body

    const workspaceMembers = await Promise.all(
      emails.map(email =>
        UserLib.inviteUser(
          currentWorkspaceUser._id,
          email,
          workspaceId,
          teams,
          role,
          teamRole,
          typeof sendEmail === 'boolean' ? sendEmail : true,
          addToWorkspace,
        ),
      ),
    )

    await BillingService.updateSubscriptionOnUserAdded(workspaceId)

    return res.status(200).json(workspaceMembers)
  } catch (err) {
    return next(err)
  }
}
