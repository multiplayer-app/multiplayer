import type { Request, Response, NextFunction } from 'express'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = req.account

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
