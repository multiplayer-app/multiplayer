import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const projectMembers = await ProjectModel.listUsers(
      projectId,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(projectMembers)
  } catch (err) {
    return next(err)
  }
}
