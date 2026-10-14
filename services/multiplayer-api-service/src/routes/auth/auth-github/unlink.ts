import type { Request, Response, NextFunction } from 'express'
import type { ObjectId } from '@multiplayer/mongo'
import { MethodNotAllowedError } from 'restify-errors'
import { UserModel } from '@multiplayer/models'
import { UserPrimaryEmailSourceEnum } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user

    if (user?.primaryEmailSource === UserPrimaryEmailSourceEnum.GITHUB) {
      throw new MethodNotAllowedError('Cannot unlink main profile')
    }

    await UserModel.removeGithubProfile(user?._id as ObjectId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
