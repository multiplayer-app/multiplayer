import { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { current } = req.body

    if (!req.session.users?.find((userId) => userId.toString() === current)) {
      throw new NotFoundError(ErrorMessage.SESSION_NOT_FOUND)
    }

    req.session.current = current

    const data = {
      current: req.session.current,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
