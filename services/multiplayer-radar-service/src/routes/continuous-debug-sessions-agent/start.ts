import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { JwtToken } from '@multiplayer/util'
import {
  IIntegrationApiKeyJwtPaylaod,
  IntegrationTypeEnum,
  ObjectTypeEnum,
  IDebugSession,
} from '@multiplayer/types'
import {
  EndUserModel,
  IEndUserDocument,
} from '@multiplayer/models'
import { ContinuousDebugSessionService } from '../../services'
import {
  INTEGRATION_JWT_SECRET,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req?.rawApiKeyPayload?.workspace || req?.body?.workspace
    const project = req?.rawApiKeyPayload?.project || req?.body?.project
    const {
      name,
      sessionAttributes,
      resourceAttributes,
      userAttributes,
      tags,

      // backwards compatibility
      metadata,
      clientMetadata,
      userMetadata,
    } = req.body.debugSessionData as Partial<IDebugSession> & any

    if (!workspace || !project) {
      throw new InvalidArgumentError()
    }

    let endUser: IEndUserDocument | null = null
    if (userAttributes) {
      endUser = await EndUserModel.createEndUser({
        workspace,
        project,
        attributes: userAttributes,
      })
    }

    const debugSessionPayload: Partial<IDebugSession> = {
      name,
      tags: tags || [],
      sessionAttributes: sessionAttributes || { ...(metadata || {}), ...(userMetadata || {}) } || {},
      resourceAttributes: resourceAttributes || clientMetadata || {},
      userAttributes,
      ...endUser ? { endUserHash: endUser.hash } : {},
    }

    const continuousDebugSessionId = await ContinuousDebugSessionService.startContinuousDebugSession(
      workspace,
      project,
      debugSessionPayload,
    )

    // temp token used in chrome extension
    const tempJwtKeyPayload: IIntegrationApiKeyJwtPaylaod = {
      workspace,
      project,
      type: IntegrationTypeEnum.OTEL,
      temporary: true,
      objectType: ObjectTypeEnum.CONTINUOUS_DEBUG_SESSION,
      objectId: continuousDebugSessionId,
    }

    const tempJwtToken = JwtToken.generateJwtToken(
      tempJwtKeyPayload,
      INTEGRATION_JWT_SECRET,
      {
        expiresIn: 30 * 24 * 60 * 60, // 30 days
      },
    )

    const data = {
      _id: continuousDebugSessionId,
      shortId: continuousDebugSessionId,
      tempApiKey: tempJwtToken,
      workspace,
      project,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
