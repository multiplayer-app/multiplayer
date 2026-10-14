import { Request, Response, NextFunction } from 'express'
import { OauthClientModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.clientId as string
    await OauthClientModel.removeOauthClientById(clientId)
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
