import type { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = {} // todo: update primary email?

    const user = await UserModel.updateUserById(String(req.session.current), payload)

    return res.status(200).json(user)
  } catch (err) {
    return next(err)
  }
}
