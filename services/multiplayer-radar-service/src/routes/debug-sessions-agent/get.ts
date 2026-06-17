import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  DebugSessionModel,
  IDebugSessionDocument,
} from '@multiplayer/models'
import {
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import { DebugSessionShortIdCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let debugSessionId = req.params.debugSessionId as string | undefined
    const {
      workspace,
      project,
    } = req.rawApiKeyPayload || {}

    if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
      debugSessionId = await DebugSessionShortIdCache.get(debugSessionId)

      if (!debugSessionId) {
        throw new NotFoundError('Debug-Session not found')
      }
    }

    let debugSession: IDebugSessionDocument | undefined

    if (workspace && project) {
      debugSession = await DebugSessionModel.findDebugSessionByIdAndProjectAndWorkspace(
        debugSessionId as string,
        project,
        workspace,
      )
    } else {
      debugSession = await DebugSessionModel.findDebugSessionById(
        debugSessionId as string,
      )
    }

    if (!debugSession) {
      throw new NotFoundError('Debug-Session not found')
    }

    const data = {
      _id: debugSession._id,
      startedAt: debugSession.startedAt,
      stoppedAt: debugSession.stoppedAt,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
