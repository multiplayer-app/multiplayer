import type { Request, Response, NextFunction } from 'express'
import {
  WorkspaceModel,
  AccountModel,
  IUserDocument,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import { AccessControlContext } from '@multiplayer/auth'
import { ErrorMessage } from '@multiplayer/types'
import { CleanupUtil } from '../../util'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as IUserDocument
    const workspaceId = req.params.workspaceId as string
    const account = req.account

    const workspace = await WorkspaceModel.findWorkspaceById(
      workspaceId,
      { billing: 1 },
    )

    if (!workspace) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
    }

    logger.info({
      user: user._id,
      workspace: workspaceId,
    }, 'Workspace was deleted')

    await WorkspaceModel.deleteWorkspaceById(workspaceId)
    await AccountModel.removeAccountById(account._id)

    await AccessControlContext.invalidateContext({
      workspaceId,
      // userIds: workspace.users.map(user => user.)
    })
    // await Promise.all()

    // Fired off, not awaited: cleanup runs in the background, same as when this
    // went through the `cleanup` AMQP queue. cleanupWorkspace catches and logs
    // its own errors, so nothing here needs to handle rejection.
    CleanupUtil.cleanupWorkspace(workspaceId)

    await stripe.cancelSubscription(
      workspace?.billing.stripe.subscriptionId as string,
    )
    await stripe.deleteCustomer(account.billing.stripe.customerId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
