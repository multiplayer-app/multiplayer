import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const reviews = await ProjectBranchModel.findProjectBranchReviewsByBranchId(projectBranchId, {
      skip, limit,
    })

    return res.status(200).json(reviews)
  } catch (err) {
    return next(err)
  }
}
