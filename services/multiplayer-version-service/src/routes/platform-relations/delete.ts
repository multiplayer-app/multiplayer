import { NextFunction, Request, Response } from 'express'
import { PlatformRelationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const platformEntityId = req.params.platformEntityId as string
    const sourceEntity = req.query.sourceEntity as string
    const targetEntity = req.query.targetEntity as string

    if (sourceEntity && !targetEntity) {
      await PlatformRelationModel.deletePlatformRelationByFilter(projectBranchId, {
        parentEntityId: platformEntityId,
        relatedTo: sourceEntity,
      })
    } else {
      await PlatformRelationModel.deletePlatformRelationByFilter(projectBranchId, {
        parentEntityId: platformEntityId,
        sourceEntityId: sourceEntity,
        targetEntityId: targetEntity,
      })
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
