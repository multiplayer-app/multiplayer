import type { Request, Response, NextFunction } from 'express'
import {
  DebugSessionService,
  ContinuousDebugSessionService,
} from '../../services'
import { transformClickhouseStream } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const cursorReq: any = {}

    if (skip !== undefined && limit !== undefined) {
      cursorReq.skip = skip
      cursorReq.limit = limit
    }

    let rrwebEventsStream
    let totalRrwebEventsCount

    if (req.debugSession.continuousDebugSession) {
      const filter = {
        workspaceId: req.debugSession.workspace.toString(),
        projectId: req.debugSession.project.toString(),
        continuousDebugSessionId: req.debugSession.continuousDebugSession,
        fromTimestamp: new Date(req.debugSession.startedAt),
        toTimestamp: new Date(req.debugSession.stoppedAt),
      }

      const [
        _rrwebEventsStream,
        _totalRrwebEventsCount,
      ] = await Promise.all([
        ContinuousDebugSessionService.listDebugSessionRrwebEvents(
          filter,
          cursorReq,
        ),
        ContinuousDebugSessionService.getTotalDebugSessionRrwebEventsCount(filter),
      ])

      rrwebEventsStream = _rrwebEventsStream
      totalRrwebEventsCount = _totalRrwebEventsCount
    } else {
      const filter = {
        debugSessionId,
      }

      const [
        _rrwebEventsStream,
        _totalRrwebEventsCount,
      ] = await Promise.all([
        DebugSessionService.listDebugSessionRrwebEvents(filter, cursorReq),
        DebugSessionService.getTotalDebugSessionRrwebEventsCount(filter),
      ])

      rrwebEventsStream = _rrwebEventsStream
      totalRrwebEventsCount = _totalRrwebEventsCount
    }

    const cursor = {
      skip,
      limit,
      total: totalRrwebEventsCount,
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    })

    return rrwebEventsStream
      .pipe(transformClickhouseStream(cursor))
      .pipe(res)
  } catch (err) {
    return next(err)
  }
}
