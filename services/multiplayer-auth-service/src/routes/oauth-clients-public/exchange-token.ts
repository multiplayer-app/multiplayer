import { NextFunction, Request, Response } from 'express'
import crypto from 'crypto'
import { TokenModel } from '@multiplayer/models'
import {
  OauthCodeData,
  OauthTokenType,
  TokenTypeEnum,
} from '@multiplayer/types'
import { RandomToken } from '@multiplayer/util'
import logger from '@multiplayer/logger'
import { OauthTokenStore } from '../../cache'
import {
  OAUTH_ACCESS_TOKEN_EXPIRATION_SECONDS,
  OAUTH_REFRESH_TOKEN_EXPIRATION_SECONDS,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      grant_type,
      code,
      redirect_uri,
      code_verifier,
      client_id,
      refresh_token,
    } = req.body

    let codeEntry: Pick<OauthCodeData, 'clientId' |
      'userId' |
      'scope' |
      'oauthTokenType' |
      'workspaceId' |
      'projectId'>

    logger.info({
      grant_type,
      code,
      redirect_uri,
      code_verifier,
      client_id,
      refresh_token,
    }, '[DEBUG_EXCHANGE_TOKEN] Attempting to exchange token for client_id')

    if (grant_type === 'refresh_token') {
      // Atomically find-and-delete the refresh token so concurrent requests using
      // the same token can't both succeed — only one will get the document back.
      const refreshToken = await TokenModel.findByToken(
        RandomToken.hashToken(refresh_token),
        TokenTypeEnum.OAUTH_REFRESH_TOKEN,
      )

      logger.info({
        client_id,
        grant_type,
        tokenId: refreshToken?._id.toString(),
        expiresAt: refreshToken?.expiresAt,
      }, '[DEBUG_EXCHANGE_TOKEN] Refresh token found and deleted')

      if (
        !refreshToken
        || !refreshToken.meta.clientId
        || !refreshToken.user
      ) {
        logger.info({
          client_id,
          grant_type,
          refresh_token,
        }, '[DEBUG_EXCHANGE_TOKEN] Refresh token not found or invalid')

        return res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Invalid or expired refresh token',
        })
      }

      // Delete the corresponding access token(s) for this client.
      // The refresh token itself was already removed above.
      await TokenModel.deleteMany({
        'meta.clientId': refreshToken.meta.clientId,
        type: TokenTypeEnum.OAUTH_ACCESS_TOKEN,
      })

      logger.info({
        client_id,
        grant_type,
        clientId: refreshToken.meta.clientId,
        type: TokenTypeEnum.OAUTH_ACCESS_TOKEN,
      }, '[DEBUG_EXCHANGE_TOKEN] Access tokens deleted for client')


      codeEntry = {
        clientId: refreshToken.meta.clientId,
        userId: refreshToken.user.toString(),
        scope: (refreshToken.meta.scopes || []).join(','),
        workspaceId: refreshToken.meta.workspace?.toString(),
        projectId: refreshToken.meta.project?.toString(),
        oauthTokenType: refreshToken.meta.oauthTokenType as OauthTokenType,
      }
    } else if (grant_type === 'authorization_code') {
      const authData = await OauthTokenStore.getAuthorizationCode(code)
      codeEntry = authData


      logger.info({
        client_id,
        grant_type,
        authData,
      }, '[DEBUG_EXCHANGE_TOKEN] Get auth data for authorization code')


      if (!authData) {
        return res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Invalid or expired code',
        })
      }

      if (
        redirect_uri !== authData.redirectUri
        || client_id !== authData.clientId
      ) {
        logger.info({
          client_id,
          redirect_uri,
          authData,
        }, '[DEBUG_EXCHANGE_TOKEN] Mismatched redirect_uri or client_id')

        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Mismatched redirect_uri or client_id',
        })
      }

      const expectedChallenge = generateCodeChallenge(
        code_verifier,
        authData.codeChallengeMethod,
      )

      if (expectedChallenge !== authData.codeChallenge) {
        logger.info({
          client_id,
          expectedChallenge,
          codeChallenge: authData.codeChallenge,
        }, '[DEBUG_EXCHANGE_TOKEN] Invalid code_verifier')

        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid code_verifier',
        })
      }

      // Invalidate the authorization code
      await OauthTokenStore.invalidateAuthorizationCode(code)

      logger.info({
        client_id,
        grant_type,
        code,
      }, '[DEBUG_EXCHANGE_TOKEN] Invalidate authorization code and proceed to issue tokens')


    } else {
      logger.info({
        client_id,
        grant_type,
      }, '[DEBUG_EXCHANGE_TOKEN] Unsupported grant type')

      return res.status(400).json({
        error: 'unsupported_grant_type',
      })
    }

    // Issue access token
    const accessToken = crypto.randomBytes(32).toString('hex')

    await TokenModel.createToken(
      TokenTypeEnum.OAUTH_ACCESS_TOKEN,
      codeEntry.userId,
      {
        token: RandomToken.hashToken(accessToken),
        expiresAt: new Date(Date.now() + OAUTH_ACCESS_TOKEN_EXPIRATION_SECONDS * 1000),
        meta: {
          oauthTokenType: codeEntry.oauthTokenType || OauthTokenType.PROJECT,
          workspace: codeEntry.workspaceId,
          project: codeEntry.projectId,
          scopes: codeEntry.scope.split(','),
          clientId: codeEntry.clientId,
        },
      },
    )

    const refreshToken = crypto.randomBytes(32).toString('hex')
    await TokenModel.createToken(
      TokenTypeEnum.OAUTH_REFRESH_TOKEN,
      codeEntry.userId,
      {
        token: RandomToken.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + OAUTH_REFRESH_TOKEN_EXPIRATION_SECONDS * 1000),
        meta: {
          oauthTokenType: codeEntry.oauthTokenType || OauthTokenType.PROJECT,
          workspace: codeEntry.workspaceId,
          project: codeEntry.projectId,
          scopes: codeEntry.scope.split(','),
          clientId: codeEntry.clientId,
        },
      },
    )

    if (refresh_token) {
      await TokenModel.deleteByToken(
        refresh_token,
        TokenTypeEnum.OAUTH_REFRESH_TOKEN,
      )

      logger.info({
        client_id,
        refresh_token,
      }, '[DEBUG_EXCHANGE_TOKEN] Old refresh token deleted successfully')
    }


    logger.info({
      client_id,
      accessTokenExpiresAt: new Date(Date.now() + OAUTH_ACCESS_TOKEN_EXPIRATION_SECONDS * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + OAUTH_REFRESH_TOKEN_EXPIRATION_SECONDS * 1000),
      codeEntry,
    }, '[DEBUG_EXCHANGE_TOKEN] Created access and refresh tokens successfully, returning response')


    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: OAUTH_ACCESS_TOKEN_EXPIRATION_SECONDS,
      scope: codeEntry.scope,
      extra: {
        workspace: codeEntry.workspaceId,
        project: codeEntry.projectId,
        userId: codeEntry.userId,
      },
    })
  } catch (err) {
    return next(err)
  }
}

function generateCodeChallenge(verifier: string, method: string) {
  if (method === 'S256') {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest()
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  } else {
    throw new Error('Unsupported code_challenge_method')
  }
}
