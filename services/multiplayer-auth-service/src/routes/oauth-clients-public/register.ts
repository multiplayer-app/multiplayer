import { Request, Response, NextFunction } from 'express'
import { OauthClientModel } from '@multiplayer/models'
import { JwtToken } from '@multiplayer/util'
import { ObjectId } from '@multiplayer/mongo'
import crypto from 'crypto'
import {
  API_DOMAIN,
  API_PREFIX,
  API_PROTOCOL,
  OAUTH_JWT_SECRET,
  OAUTH_CLIENT_SECRET_EXPIRATION_SECONDS,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      redirect_uris,
      client_name,
      client_uri,
      logo_uri,
      grant_types,
      response_types,
      scope,
    } = req.body

    const clientId = new ObjectId()
    const jwtPayload = {
      clientId: clientId.toString(),
      grantTypes: grant_types,
    }

    const token = JwtToken.generateJwtToken(
      jwtPayload,
      OAUTH_JWT_SECRET,
    )

    const clientSecret = crypto.randomBytes(64).toString('hex')

    const client = await OauthClientModel.createOauthClient({
      _id: clientId,
      redirectUris: redirect_uris as string[],
      clientName: client_name as string,
      clientUri: client_uri as string,
      logoUri: logo_uri || '',
      grantTypes: grant_types as string[],
      responseTypes: response_types as string[],
      registrationToken: token,
      clientSecret: clientSecret,
      clientSecretExpiresAt: Math.floor(Date.now() / 1000) + OAUTH_CLIENT_SECRET_EXPIRATION_SECONDS,
      scope: scope as string || 'debug-sessions',
    })

    return res.status(200).json({
      client_id: client._id,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(new Date(client.createdAt).getTime() / 1000),
      client_secret_expires_at: client.clientSecretExpiresAt,
      registration_access_token: token,
      registration_client_uri: `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/public/oauth-clients/${clientId}`,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
    })
  } catch (err) {
    return next(err)
  }
}
