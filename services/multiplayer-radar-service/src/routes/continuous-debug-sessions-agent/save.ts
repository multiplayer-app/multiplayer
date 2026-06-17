import type { Request, Response, NextFunction } from 'express'
import {
  IDebugSession,
  DebugSessionCreationReasonType,
} from '@multiplayer/types'
import {
  ContinuousDebugSessionService,
  DebugSessionService,
} from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const continuousDebugSessionId = req.params.continuousDebugSessionId as string
    const {
      name = '',
      sessionAttributes,
      resourceAttributes,
      tags,

      // backwards compatibility
      metadata,
      clientMetadata,
      userMetadata,
    } = req.body

    const debugSessionPayload: Partial<IDebugSession> = {
      name,
      tags: tags || [],
      sessionAttributes: sessionAttributes || { ...(metadata || {}), ...(userMetadata || {}) } || {},
      resourceAttributes: resourceAttributes || clientMetadata || {},
    }

    const debugSession = await ContinuousDebugSessionService.saveContinuousDebugSession(
      continuousDebugSessionId,
      debugSessionPayload,
      DebugSessionCreationReasonType.MANUAL,
    )

    const debugSessionObject = debugSession.toObject()

    const _debugSessionUrl = await DebugSessionService.getDebugSessionUrl(debugSession)

    return res.status(200).json({
      ...debugSessionObject,
      url: _debugSessionUrl,
    })
  } catch (err) {
    return next(err)
  }
}
