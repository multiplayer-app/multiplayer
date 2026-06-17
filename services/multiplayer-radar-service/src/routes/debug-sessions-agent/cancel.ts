import type { Request, Response, NextFunction } from 'express'
import { DebugSessionModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { NotFoundError } from 'restify-errors'
import {
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import {
  DebugSessionEvents,
} from '@multiplayer/types'
import { DebugSessionService } from '../../services'
import { S3_DEBUG_SESSIONS_BUCKET } from '../../config'
import {
  DebugSessionHelper,
  WebSocketHelper,
} from '../../helpers'
import * as websocket from '../../websocket'
import {
  DebugSessionShortIdCache,
  DebugSessionCache,
} from '../../cache'


export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSession = req.debugSession
    let debugSessionId = req.params.debugSessionId as string | undefined


    if (debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH) {
      debugSessionId = await DebugSessionShortIdCache.get(debugSessionId)

      if (!debugSessionId) {
        throw new NotFoundError('Debug-Session not found')
      }
    }

    await Promise.all([
      DebugSessionService.deleteLogsByDebugSessionId(debugSessionId as string),
      DebugSessionService.deleteTracesByDebugSessionId(debugSessionId as string),
      DebugSessionService.deleteDebugSessionRrwebEventsById(debugSessionId as string),
      s3.deleteObjectsByPrefix(
        S3_DEBUG_SESSIONS_BUCKET,
        DebugSessionHelper.getS3DebugSessionFolder({
          workspaceId: debugSession.workspace,
          projectId: debugSession.project,
          debugSessionId: debugSessionId as string,
        }),
      ),
      DebugSessionModel.deleteDebugSessionById(debugSessionId as string),
      DebugSessionShortIdCache.unset(debugSession.shortId),
      DebugSessionCache.unset(debugSession._id.toString()),
    ])

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      debugSession.workspace,
      debugSession.project,
      WebSocketHelper.getSessionRecordingRoomInProject(debugSession.workspace, debugSession.project),
      DebugSessionEvents.DEBUG_SESSION_CANCELED,
      {
        data: debugSession,
      },
    )

    const _debugSessionUrl = await DebugSessionService.getDebugSessionUrl(debugSession)

    const _debugSession = {
      ...debugSession.toObject(),
      url: _debugSessionUrl,
    }

    websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
      WebSocketHelper.getSessionRecordingRoomById(debugSession._id.toString()),
      DebugSessionEvents.DEBUG_SESSION_CANCELED,
      {
        data: _debugSession,
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
