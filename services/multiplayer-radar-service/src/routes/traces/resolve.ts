import type { Request, Response, NextFunction } from 'express'
import { TraceResolutionService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const traceId = req.params.traceId as string

    const resolution = await TraceResolutionService.resolveTrace(workspaceId, projectId, traceId)

    return res.status(200).json(resolution)
  } catch (err) {
    return next(err)
  }
}
