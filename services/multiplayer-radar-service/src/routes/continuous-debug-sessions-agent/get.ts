import type { Request, Response, NextFunction } from 'express'
import { ContinuousDebugSessionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const continuousDebugSessionId = req.params.continuousDebugSessionId as string

    const continuousDebugSession = await ContinuousDebugSessionService.getContinuousDebugSessionById(continuousDebugSessionId)

    return res.status(200).json(continuousDebugSession)
  } catch (err) {
    return next(err)
  }
}
