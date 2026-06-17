import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { FeatureFlag } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { flag, workspaceId, enabled } = req.body
    const workspace = await WorkspaceModel.updateWorkspaceFeatureAccessById(
      workspaceId,
      FeatureFlag[flag],
      enabled,
    )

    return res.status(200).json(workspace)
  } catch (err) {
    return next(err)
  }
}
