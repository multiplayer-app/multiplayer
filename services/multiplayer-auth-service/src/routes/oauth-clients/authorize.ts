import { Request, Response, NextFunction } from 'express'
import { OauthClientModel } from '@multiplayer/models'
import { ForbiddenError, InternalError } from 'restify-errors'
import crypto from 'crypto'
import { ErrorMessage } from '@multiplayer/types'
import { OauthTokenStore } from '../../cache'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new InternalError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const clientId = req.params.clientId as string
    const {
      codeChallenge,
      codeChallengeMethod,
      redirectUri,
      scope,
      workspaceId,
      projectId,
      tokenType,
    } = req.body

    const client = await OauthClientModel.findOauthClientById(clientId as string)
    if (
      !client
      || client.clientSecretExpiresAt < Math.floor(Date.now() / 1000)
      || !client.redirectUris.find((url) => redirectUri === url)
    ) {
      throw new ForbiddenError('Client is invalid or expired')
    }

    const scopes = Object.keys(scope || {}).map((item) => {
      return scope[item].map((action) => `${item}:${action}`).join(',')
    }).join(',')

    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex')

    await OauthTokenStore.storeAuthorizationCode(
      code,
      {
        clientId,
        redirectUri,
        userId: req.user._id.toString(),
        codeChallenge,
        codeChallengeMethod,
        scope: scopes,
        workspaceId,
        projectId,
        oauthTokenType: tokenType,
      }, 60)

    return res.status(200).json(code)
  } catch (err) {
    return next(err)
  }
}