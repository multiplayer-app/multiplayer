import type { Request, Response, NextFunction } from 'express'
import { DebugSessionModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string

    const { starId } = req.body

    const debugSession = await DebugSessionModel.removeDebugSessionStarredItemById(
      workspaceId,
      projectId,
      debugSessionId,
      starId,
    )

    return res.status(200).json(debugSession)
  } catch (err) {
    return next(err)
  }
}
