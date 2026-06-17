import type { Request, Response, NextFunction } from 'express'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = req.account
    const workspace = req.workspace

    const url = await stripe.getCustomerPortalUrl(
      account?.billing.stripe.customerId as string,
      workspace.billing.stripe.subscriptionId,
    )

    const data = {
      url,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
