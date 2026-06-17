import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel, DebugSessionModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { DebugSessionService } from '../../services'
import { S3_DEBUG_SESSIONS_BUCKET } from '../../config'
import { DebugSessionHelper } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string

    await Promise.all([
      DebugSessionService.deleteLogsByDebugSessionId(debugSessionId),
      DebugSessionService.deleteTracesByDebugSessionId(debugSessionId),
      DebugSessionService.deleteDebugSessionRrwebEventsById(debugSessionId),
      s3.deleteObjectsByPrefix(
        S3_DEBUG_SESSIONS_BUCKET,
        DebugSessionHelper.getS3DebugSessionFolder({
          workspaceId,
          projectId,
          debugSessionId,
        }),
      ),
      AgentChatModel.removeDebugSessionReferences(debugSessionId),
    ])

    await DebugSessionModel.deleteDebugSessionById(debugSessionId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
