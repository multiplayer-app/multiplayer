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
import AMQP from '@multiplayer/amqp'
import { AMQP_CLEANUP_QUEUE } from '../../config'
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

    await AMQP.publish(
      AMQP_CLEANUP_QUEUE,
      {
        variables: {
          type: 'WORKSPACE',
          workspace: workspaceId,
        },
      },
      {
        durable: true,
      },
    )

    await stripe.cancelSubscription(
      workspace?.billing.stripe.subscriptionId as string,
    )
    await stripe.deleteCustomer(account.billing.stripe.customerId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
