import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { FeatureFlag } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const flag = req.params.flag as string

    const hasAccess = await WorkspaceModel.hasFeatureAccess(workspaceId, FeatureFlag[flag])
    return res.status(200).json(hasAccess)
  } catch (err) {
    return next(err)
  }
}
