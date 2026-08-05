import { Request, Response, NextFunction } from 'express'
import { OauthClientModel } from '@multiplayer/models'
import { BadRequestError, ForbiddenError, NotFoundError } from 'restify-errors'


export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.clientId as string
    const {
      response_type,
      redirect_uri,
    } = req.query

    const client = await OauthClientModel.findOauthClientById(clientId)
    if (!client) {
      return next(new NotFoundError('No client found'))
    }
    if (client.clientSecretExpiresAt < Math.floor(Date.now() / 1000)) {
      return next(new ForbiddenError('Client secret is expired'))
    }
    if (!client.redirectUris.find((url) => redirect_uri === url)) {
      return next(new ForbiddenError('Redirect urls do not match'))
    }
    if (response_type !== 'code') {
      return next(new BadRequestError('response type is not supported'))
    }

    return res.status(200).json({
      _id: client._id,
      clientName: client.clientName,
      clientUri: client.clientUri,
      logoUri: client.logoUri,
      scope: client.scope,
    })
  } catch (err) {
    return next(err)
  }
}
