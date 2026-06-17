import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  AlertRuleConditionType,
  IDebugSession,
} from '@multiplayer/types'
import {
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import {
  DebugSessionService,
  AlertService,
} from '../../services'
import { DebugSessionShortIdCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let debugSessionId = req.params.debugSessionId as string | undefined
    const {
      sessionAttributes,
      stoppedAt,

      // backwards compatibility
      metadata,
      userMetadata,
    } = req.body

    if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
      debugSessionId = await DebugSessionShortIdCache.get(debugSessionId as string)

      if (!debugSessionId) {
        throw new NotFoundError('Debug-Session not found')
      }
    }

    const _sessionAttributes = {
      ...(sessionAttributes || { ...(metadata || {}), ...(userMetadata || {}) } || {}),
      ...JSON.parse(JSON.stringify(req.debugSession.toObject().sessionAttributes || {})),
    }

    delete _sessionAttributes._id

    const debugSession = await DebugSessionService.stopDebugSessionById(
      debugSessionId as string,
      {
        sessionAttributes: _sessionAttributes,
        stoppedAt,
      },
    )

    const debugSessionObject: IDebugSession = (debugSession as any)?.toObject
      ? (debugSession as any)?.toObject()
      : debugSession

    debugSessionObject.url = await DebugSessionService.getDebugSessionUrl(debugSessionObject)

    await AlertService.sendAlert(
      debugSessionObject.workspace,
      debugSessionObject.project,
      {
        sessionRecording: debugSessionObject,
        conditionType: AlertRuleConditionType.SESSION_RECORDING_CREATED,
      },
    )

    return res.status(200).json(debugSessionObject)
  } catch (err) {
    return next(err)
  }
}
