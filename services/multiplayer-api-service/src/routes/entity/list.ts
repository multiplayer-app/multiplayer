import type { Request, Response, NextFunction } from 'express'
import { EntityModel } from '@multiplayer/models'
import type { EntityType } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const type = req.query.type as EntityType | undefined
    const key = req.query.key as string | undefined
    const _default = req.query.default as boolean | undefined

    const filter = {
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
      type,
      key,
      default: typeof _default === 'boolean' ? Boolean(_default) : undefined,
    }

    const entities = await EntityModel.findEntities(
      filter,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(entities)
  } catch (err) {
    return next(err)
  }
}
