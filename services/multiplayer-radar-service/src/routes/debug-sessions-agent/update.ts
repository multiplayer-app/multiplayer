import type { Request, Response, NextFunction } from 'express'
import { DebugSessionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspace,
      project,
    } = req.rawApiKeyPayload || {}
    const debugSessionId = req.params.debugSessionId as string

    const debugSession = await DebugSessionService.updateDebugSession(
      workspace,
      project,
      debugSessionId,
      req.body,
    )

    return res.status(200).json(debugSession)
  } catch (err) {
    return next(err)
  }
}
