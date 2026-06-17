import type { Request, Response, NextFunction } from 'express'
import { stripe } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let plans = await stripe.listPlans()

    if (req.query.default !== undefined) {
      const filterDefault = req.query.default === 'true'
      plans = plans.filter(plan => plan.default === filterDefault)
    }

    if (req.query.free !== undefined) {
      const filterFree = req.query.free === 'true'
      plans = plans.filter(plan => plan.free === filterFree)
    }

    const data = {
      data: plans,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
