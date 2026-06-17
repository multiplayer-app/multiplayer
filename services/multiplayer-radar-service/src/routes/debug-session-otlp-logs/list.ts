import type { Request, Response, NextFunction } from 'express'
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
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const cursorReq: any = {}

    if (skip !== undefined && limit !== undefined) {
      cursorReq.skip = skip
      cursorReq.limit = limit
    }

    let debugSessionLogsStream
    let totalDebugSessionLogsCount

    if (req.debugSession.continuousDebugSession) {
      const filter = {
        workspaceId: req.debugSession.workspace.toString(),
        projectId: req.debugSession.project.toString(),
        continuousDebugSessionId: req.debugSession.continuousDebugSession,
        fromTimestamp: new Date(req.debugSession.startedAt),
        toTimestamp: new Date(req.debugSession.stoppedAt),
      }

      const [
        _debugSessionLogsStream,
        _totalDebugSessionLogsCount,
      ] = await Promise.all([
        ContinuousDebugSessionService.listDebugSessionLogs(
          filter,
          cursorReq,
        ),
        ContinuousDebugSessionService.getTotalDebugSessionLogsCount(filter),
      ])

      debugSessionLogsStream = _debugSessionLogsStream
      totalDebugSessionLogsCount = _totalDebugSessionLogsCount
    } else {
      const filter = {
        workspaceId,
        projectId,
        debugSessionId,
      }

      const [
        _debugSessionLogsStream,
        _totalDebugSessionLogsCount,
      ] = await Promise.all([
        DebugSessionService.listDebugSessionLogs(
          filter,
          cursorReq,
        ),
        DebugSessionService.getTotalDebugSessionLogsCount(filter),
      ])

      debugSessionLogsStream = _debugSessionLogsStream
      totalDebugSessionLogsCount = _totalDebugSessionLogsCount
    }

    const cursor = {
      skip,
      limit,
      total: totalDebugSessionLogsCount,
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    })

    return debugSessionLogsStream
      .pipe(transformClickhouseStream(cursor))
      .pipe(res)
  } catch (err) {
    return next(err)
  }
}
