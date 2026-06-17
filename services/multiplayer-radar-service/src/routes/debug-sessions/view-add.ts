import type { Request, Response, NextFunction } from 'express'
import { DebugSessionModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string

    const view = req.body

    const debugSessionView = await DebugSessionModel.addDebugSessionViewById(
      workspaceId,
      projectId,
      debugSessionId,
      view,
    )

    return res.status(200).json(debugSessionView)
  } catch (err) {
    return next(err)
  }
}
