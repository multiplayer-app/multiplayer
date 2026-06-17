import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { DebugSessionModel } from '@multiplayer/models'

export const attachDebugSession = async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    const debugSessionId = req.params.debugSessionId as string
    const debugSession = await DebugSessionModel.findDebugSessionById(debugSessionId)

    if (!debugSession) {
      throw new NotFoundError('Debug-Session not found')
    }

    req.debugSession = debugSession

    next()
  } catch (err) {
    next(err)
  }
}
