import { Request, Response, NextFunction } from 'express'
import { OauthClientModel } from '@multiplayer/models'
import { UnauthorizedError } from 'restify-errors'
import { API_DOMAIN, API_PREFIX, API_PROTOCOL } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.clientId as string

    const client = await OauthClientModel.findOauthClientById(clientId)
    if (!client) {
      return next(new UnauthorizedError())
    }

    return res.status(200).json({
      client_id: client._id,
      client_id_issued_at: Math.floor(new Date(client.createdAt).getTime() / 1000),
      client_secret_expires_at: client.clientSecretExpiresAt,
      registration_client_uri: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/public/oauth-clients/${clientId}`,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
    })
  } catch (err) {
    return next(err)
  }
}
