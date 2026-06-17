import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { DebugSessionService } from '../../services'
import {
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import { DebugSessionShortIdCache } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspace,
      project,
    } = req.rawApiKeyPayload
    let debugSessionId = req.params.debugSessionId as string | undefined
    const { events } = req.body

    if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
      debugSessionId = await DebugSessionShortIdCache.get(debugSessionId)

      if (!debugSessionId) {
        throw new NotFoundError('Debug-Session not found')
      }
    }

    await DebugSessionService.createDebugSessionRrwebEvents(
      events.map(event => ({
        debugSessionId,
        workspaceId: workspace,
        projectId: project,
        data: event.event,
        type: event.eventType,
        timestamp: event.timestamp,
      })),
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
