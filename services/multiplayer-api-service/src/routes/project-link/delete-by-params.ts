import type { Request, Response, NextFunction } from 'express'
import { ProjectLinkLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const sourceObject = req.query.sourceObject as string
    const targetObject = req.query.targetObject as string

    await ProjectLinkLib.deleteProjectLink(
      projectBranchId,
      {
        sourceObjectId: sourceObject,
        targetObjectId: targetObject,
      },
    )
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
