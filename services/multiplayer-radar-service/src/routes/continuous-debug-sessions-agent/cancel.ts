import type { Request, Response, NextFunction } from 'express'
import { ContinuousDebugSessionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const continuousDebugSessionId = req.params.continuousDebugSessionId as string

    await ContinuousDebugSessionService.cancelContinuousDebugSession(continuousDebugSessionId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
