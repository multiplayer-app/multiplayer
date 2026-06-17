import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { DebugSessionModel } from '@multiplayer/models'
import {
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import { DebugSessionShortIdCache } from '../cache'

export const attachDebugSession = async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    let debugSessionId = req.params.debugSessionId as string | undefined

    if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
      debugSessionId = await DebugSessionShortIdCache.get(debugSessionId)

      if (!debugSessionId) {
        throw new NotFoundError('Debug-Session not found')
      }
    }

    const debugSession = await DebugSessionModel.findDebugSessionById(debugSessionId as string)

    if (!debugSession) {
      throw new NotFoundError('Debug-Session not found')
    }

    req.debugSession = debugSession

    next()
  } catch (err) {
    next(err)
  }
}
