import type { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const users = await UserModel.findUsers(undefined, {
      skip,
      limit,
    })

    return res.status(200).json(users)
  } catch (err) {
    return next(err)
  }
}
