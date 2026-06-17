import type { Request, Response, NextFunction } from 'express'
import { LinearApi } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration

    const statuses = await LinearApi.getStatuses(
      integration?.linear?.accessToken as string,
    )

    return res.status(200).json(statuses)
  } catch (err) {
    return next(err)
  }
}
