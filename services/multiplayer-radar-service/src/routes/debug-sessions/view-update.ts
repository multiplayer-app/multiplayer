import type { Request, Response, NextFunction } from 'express'
import { DebugSessionModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const viewId = req.params.viewId as string

    const view = req.body

    const debugSessionView = await DebugSessionModel.updateDebugSessionViewById(
      workspaceId,
      projectId,
      debugSessionId,
      viewId,
      view,
    )

    return res.status(200).json(debugSessionView)
  } catch (err) {
    return next(err)
  }
}
