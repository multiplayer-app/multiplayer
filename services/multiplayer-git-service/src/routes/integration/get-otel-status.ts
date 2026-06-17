import type { Request, Response, NextFunction } from 'express'
import { OtelIntegrationStatusCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let status = await OtelIntegrationStatusCache.get(req.integration._id.toString())

    if (!status) {
      status = {
        otelLogs: false,
        otelSpans: false,
        rrwebEvents: false,
      }
    }

    return res.status(200).json(status)
  } catch (err) {
    return next(err)
  }
}
