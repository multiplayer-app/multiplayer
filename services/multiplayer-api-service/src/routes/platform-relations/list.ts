import { NextFunction, Request, Response } from 'express'
import { PlatformRelationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const platformEntityId = req.params.platformEntityId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    await PlatformRelationModel.findPlatformRelations({
      parentEntityId: platformEntityId,
      projectBranchId: projectBranchId,
    }, { skip, limit })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
