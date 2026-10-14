import { Request, Response, NextFunction } from 'express'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AccessControlContext.invalidateContext({
      userId: req.session.current.toString(),
    })

    req.session.users = req.session?.users?.filter(
      (userId) => userId !== req.session.current) || []
    req.session.current = req.session.users[0]

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
