import type { Request, Response, NextFunction } from 'express'
import { EntityLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string

    const content = await EntityLib.getEntityContent(projectBranchId, entityId)
    return res.status(200).json(content)
  } catch (err) {
    return next(err)
  }
}
