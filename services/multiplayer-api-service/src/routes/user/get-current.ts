import type { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findUserById(req.session?.current as string)

    return res.status(200).json(user)
  } catch (err) {
    return next(err)
  }
}
