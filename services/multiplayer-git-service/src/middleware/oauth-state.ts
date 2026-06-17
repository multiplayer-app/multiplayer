import { Request, Response, NextFunction } from 'express'
import { InvalidCredentialsError } from 'restify-errors'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { OAuthStateCache } from '../cache'

export const attachOAuthState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stateId = req.query.state as string

    const oauthState = await OAuthStateCache.get(stateId)

    if (!oauthState) {
      throw new InvalidCredentialsError('Invalid state')
    }

    req.oauthState = oauthState

    return next()
  } catch (error) {
    return next(error)
  }
}

export const attachOauthStateSessionPath = (type: IntegrationTypeEnum) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (type === IntegrationTypeEnum.ATLASSIAN) {
      req.oauthStateSessionPath = 'oauth2:api.atlassian.com'
    } else if (type === IntegrationTypeEnum.BITBUCKET) {
      req.oauthStateSessionPath = 'oauth2:bitbucket.org'
    } else if (type === IntegrationTypeEnum.GITHUB) {
      req.oauthStateSessionPath = 'oauth2:github.com'
    } else if (type === IntegrationTypeEnum.GITLAB) {
      req.oauthStateSessionPath = 'oauth2:gitlab.com'
    } else if (type === IntegrationTypeEnum.LINEAR) {
      req.oauthStateSessionPath = 'oauth2:linear.app'
    } else if (type === IntegrationTypeEnum.SLACK) {
      req.oauthStateSessionPath = 'oauth2:slack.app'
    }

    return next()
  }
