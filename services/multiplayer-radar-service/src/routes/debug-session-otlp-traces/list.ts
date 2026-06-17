import type { Request, Response, NextFunction } from 'express'
import { SessionType } from '@multiplayer-app/session-recorder-node'
import {
  DebugSessionService,
  ContinuousDebugSessionService,
} from '../../services'
import { transformClickhouseStream } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query ? Number(req.query.limit) : undefined

    const cursorReq: any = {}

    if (skip !== undefined && limit !== undefined) {
      cursorReq.skip = skip
      cursorReq.limit = limit
    }

    let debugSessionTracesStream
    let totalDebugSessionTracesCount

    if (!req.debugSession.sessionType) {
      throw new Error('Session type missing')
    }

    if (
      [
        SessionType.CONTINUOUS,
        SessionType.SESSION,
      ].includes(req.debugSession.sessionType)
    ) {
      if (!req.debugSession.continuousDebugSession) {
        throw new Error('Continuous debug session id missing for continuous or session debug session')
      }

      const filter = {
        workspaceId: req.debugSession.workspace.toString(),
        projectId: req.debugSession.project.toString(),
        continuousDebugSessionId: req.debugSession.continuousDebugSession,
        fromTimestamp: new Date(req.debugSession.startedAt),
        toTimestamp: new Date(req.debugSession.stoppedAt),
      }

      const [
        _debugSessionTracesStream,
        _totalDebugSessionTracesCount,
      ] = await Promise.all([
        ContinuousDebugSessionService.listDebugSessionTraces(
          filter,
          cursorReq,
        ),
        ContinuousDebugSessionService.getTotalDebugSessionTracesCount(filter),
      ])

      debugSessionTracesStream = _debugSessionTracesStream
      totalDebugSessionTracesCount = _totalDebugSessionTracesCount
    } else if (
      [
        SessionType.MANUAL,
        SessionType.SESSION_CACHE,
      ].includes(req.debugSession.sessionType)
    ) {
      const filter = {
        workspaceId,
        projectId,
        debugSessionId,
      }

      const [
        _debugSessionTracesStream,
        _totalDebugSessionTracesCount,
      ] = await Promise.all([
        DebugSessionService.listDebugSessionTraces(
          filter,
          cursorReq,
        ),
        DebugSessionService.getTotalDebugSessionTracesCount(filter),
      ])

      debugSessionTracesStream = _debugSessionTracesStream
      totalDebugSessionTracesCount = _totalDebugSessionTracesCount
    }

    const cursor = {
      skip,
      limit,
      total: totalDebugSessionTracesCount,
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Connection': 'close',
    })

    return debugSessionTracesStream
      .pipe(transformClickhouseStream(cursor))
      .pipe(res)
  } catch (err) {
    return next(err)
  }
}
