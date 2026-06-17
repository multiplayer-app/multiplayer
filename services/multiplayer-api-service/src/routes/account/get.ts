import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
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
      throw new NotFoundError('Account not found')
    }

    const paymentMethods = await stripe.listPaymentMethods(account?.billing.stripe.customerId)

    const data = {
      ...account.toObject(),
      paymentMethods,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
