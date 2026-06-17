import restify from 'restify-errors'
import AMQP from '@multiplayer/amqp'
import { IUserDocument, WorkspaceModel } from '@multiplayer/models'
import type { Request, Response, NextFunction } from 'express'
import { InternalServerError } from 'restify-errors'
import { AMQP_NOTIFICATION_QUEUE } from '../config'

const { RestError, HttpError } = restify

export default async (
  err: Error | restify.RestError | restify.HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (
      (
        !(err instanceof RestError)
        && !(err instanceof HttpError)
      )
      || (err as restify.RestError).statusCode !== 402
    ) {
      return next(err)
    }

    const workspaceId = req.context.workspaceId
    const user = req.user as IUserDocument
    const billingPlanLimitation = req.billingPlanLimitation

    if (!billingPlanLimitation) {
      throw new InternalServerError('Billing plan limitation not found')
    }

    const workspace = await WorkspaceModel.findById(workspaceId)

    if ('enabled' in billingPlanLimitation) {
      return next(err)
    }

    await AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'NOTICE_LIMITS',
          email: user.primaryEmail,
          data: {
            user,
            limit: billingPlanLimitation,
            workspace,
          },
        },
      },
    )

    return next(err)
  } catch (_error) {
    return next(_error)
  }
}
