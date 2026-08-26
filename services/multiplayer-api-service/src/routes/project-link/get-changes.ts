import { NextFunction, Request, Response } from 'express'
import { ProjectLinkModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const projectLinkState = await ProjectLinkModel.getProjectLinkState(
      [projectBranchId], { withDeleted: true }, { skip, limit })

    return res.status(200).json(projectLinkState)
  } catch (err) {
    return next(err)
  }
}
