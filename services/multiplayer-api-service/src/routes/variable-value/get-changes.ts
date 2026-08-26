import { NextFunction, Request, Response } from 'express'
import { VariablesValueModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.query.entity as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const variableValues = await VariablesValueModel.getVariableValueState(
      [projectBranchId],
      {
        workspace: workspaceId,
        project: projectId,
        entity: entityId,
        withDeleted: true,
      },
      { skip, limit },
    )

    return res.status(200).json(variableValues)
  } catch (err) {
    return next(err)
  }
}
