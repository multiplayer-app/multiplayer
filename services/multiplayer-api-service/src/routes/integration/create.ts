import type { Request, Response, NextFunction } from 'express'
import { InternalServerError } from 'restify-errors'
import {
  IntegrationModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IIntegration,
  IIntegrationApiKeyJwtPaylaod,
} from '@multiplayer/types'
import { ObjectId } from '@multiplayer/mongo'
import { JwtToken } from '@multiplayer/util'
import { INTEGRATION_JWT_SECRET } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.context?.userId)
    const workspaceId = req.params.workspaceId as string
    const {
      project,
      workspaceRole,
      projectRole: projectRoleId,
      name,
      description,
      type,
      authType,
      otel,
    } = req.body

    let workspaceUser

    if (userId) {
      workspaceUser = await WorkspaceUserModel.findWorkspaceUser(userId, workspaceId)
    }

    const integrationPayload: IIntegration = {
      _id: new ObjectId().toString(),
      workspace: workspaceId,
      project,
      type,
      authType,
      workspaceUser: workspaceUser?._id?.toString(),
      workspaceRole,
      projectRole: projectRoleId,
      name,
      description,
      otel,
    }

    let apiKey

    if (type === IntegrationTypeEnum.API_KEY) {
      const jwtPayload: IIntegrationApiKeyJwtPaylaod = {
        integration: integrationPayload._id.toString(),
        workspace: workspaceId,
        project,
        type,
      }

      apiKey = JwtToken.generateJwtToken(
        jwtPayload,
        INTEGRATION_JWT_SECRET,
      )

      integrationPayload.apiKey = {
        apiKey,
      }
    } else if (type === IntegrationTypeEnum.OTEL) {
      const jwtPayload: IIntegrationApiKeyJwtPaylaod = {
        integration: integrationPayload._id.toString(),
        workspace: workspaceId,
        project,
        type,
      }

      apiKey = JwtToken.generateJwtToken(
        jwtPayload,
        INTEGRATION_JWT_SECRET,
      )

      integrationPayload.otel = {
        autoCreateRelease: true,
        autoMergeEnabled: true,
        ...(integrationPayload.otel || {}),
        apiKey,
      }
    }

    const integration = await IntegrationModel.createIntegration(integrationPayload)

    const integrationObject = integration.toObject()

    if (apiKey) {
      if (type === IntegrationTypeEnum.API_KEY) {
        integrationObject.apiKey = {
          apiKey,
        }
      } else if (type === IntegrationTypeEnum.OTEL) {
        integrationObject.otel = {
          ...(integrationObject.otel || {}),
          apiKey,
        }
      }
    }

    return res.status(200).json(integrationObject)
  } catch (err) {
    return next(err)
  }
}
