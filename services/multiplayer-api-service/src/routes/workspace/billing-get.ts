import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string

    const workspaceBilling = await WorkspaceModel.getWorkspaceBillingById(workspaceId)
    const subscriptionInfo = await stripe.getSubscriptionInfo(workspaceBilling?.stripe.subscriptionId as string)

    const data = {
      ...subscriptionInfo,
      trialEndsAt: workspaceBilling?.stripe?.trialEndsAt,
      paidAtLeastOneTime: workspaceBilling?.stripe?.paidAtLeastOneTime,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
