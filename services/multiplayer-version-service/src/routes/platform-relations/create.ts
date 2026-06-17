import { NextFunction, Request, Response } from 'express'
import { PlatformRelationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const platformEntityId = req.params.platformEntityId as string

    const { sourceEntity, targetEntity } = req.body

    const relation = await PlatformRelationModel.createPlatformRelation({
      workspace: workspaceId,
      project: projectId,
      parentEntity: platformEntityId,
      projectBranch: projectBranchId,
      sourceEntity,
      targetEntity,
    })

    return res.status(200).json(relation)
  } catch (err) {
    return next(err)
  }
}
