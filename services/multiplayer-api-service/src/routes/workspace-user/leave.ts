import type { Request, Response, NextFunction } from 'express'
import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError } from 'restify-errors'
import {
  WorkspaceModel,
  WorkspaceUserModel,
  TeamModel,
  ProjectModel,
  AccountModel,
  IWorkspaceUserDocument,
  UserModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import {
  WorkspaceUserStatus,
} from '@multiplayer/types'
import { isFreeEmail } from '@multiplayer/util-shared'
import { BillingService } from '../../services'
import { RoleLib, stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const user = req.user
    const workspace = req.workspace
    const account = req.account
    const workspaceUser = req.workspaceUser as IWorkspaceUserDocument

    const [workspaceMember] = await WorkspaceModel.getWorkspaceMembersByWorkspaceUserIds(
      workspaceId,
      [workspaceUser._id],
    )

    await WorkspaceModel.removeUser(
      workspaceId,
      workspaceMember._id,
    )

    await WorkspaceUserModel.updateWorkspaceUser(
      workspaceUser.user,
      workspaceId,
      {
        status: WorkspaceUserStatus.PENDING,
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

    const workspaceOwnerRole = await RoleLib.fetchWorkspaceOwnerRole()

    if (
      (workspaceMember.role as any as ObjectId).equals(workspaceOwnerRole._id)
      && user?._id.equals(account.owner)
    ) {
      const remainingWorkspaceUserOwner = workspace.users.find((_workspaceMember) =>
        !(_workspaceMember._id as any as ObjectId).equals(workspaceMember._id)
        && (_workspaceMember.role as any as ObjectId).equals(workspaceOwnerRole._id),
      )

      if (!remainingWorkspaceUserOwner) {
        throw new NotFoundError('No remaining workspace user owner found')
      }

      const newWorkspaceUserOwner = await WorkspaceUserModel.findWorkspaceUserById(
        remainingWorkspaceUserOwner.workspaceUser as string,
      )

      if (!newWorkspaceUserOwner) {
        throw new NotFoundError('No new workspace user owner found')
      }

      const newUserOwner = await UserModel.findUserById(
        newWorkspaceUserOwner.user,
      )

      if (!newUserOwner) {
        throw new NotFoundError('New user owner found')
      }

      await AccountModel.updateAccountById(
        account._id,
        {
          owner: newUserOwner._id.toString(),
        },
      )

      let companyName = ''

      if (!isFreeEmail(newUserOwner.primaryEmail)) {
        companyName = newUserOwner.primaryEmail.match(/@(.*)(\..*)$/)?.[1] as string
      }
      const customerName = `${newUserOwner.firstName || ''} ${newUserOwner.lastName || ''} ${companyName.length ? `at ${companyName}` : ''}`.trim()

      await stripe.updateCustomer(
        account.billing.stripe.customerId,
        {
          email: newUserOwner.primaryEmail,
          name: customerName,
        },
      )
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
