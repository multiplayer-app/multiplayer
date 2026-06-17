import type { Request, Response, NextFunction } from 'express'
import { EntityModel } from '@multiplayer/models'
import { EntityType } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const entityType = req.query.type as EntityType | EntityType[] | undefined

    const aliases = await EntityModel.getEntityAliases({
      workspaceId,
      projectId,
      projectBranchId,
      type: entityType,
    })

    return res.status(200).json(aliases)
  } catch (err) {
    return next(err)
  }
}
