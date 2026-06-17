import type { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from 'restify-errors'
import { AccountModel } from '@multiplayer/models'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.accountId as string
    const userId = req.context.userId as string

    const account = await AccountModel.findAccountByIdAndOwner(
      accountId,
      userId,
    )

    if (!account) {
      throw new ForbiddenError()
    }

    const url = await stripe.getCustomerPortalUrl(
      account?.billing.stripe.customerId as string,
    )

    const data = {
      url,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
