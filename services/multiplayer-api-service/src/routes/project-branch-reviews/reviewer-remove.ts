import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const payload = req.body

    await ProjectBranchModel.removeReview(
      projectBranchId,
      payload.workspaceUser,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
