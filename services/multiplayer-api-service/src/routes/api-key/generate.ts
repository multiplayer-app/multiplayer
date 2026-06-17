import type { NextFunction, Request, Response } from 'express'
import { IIntegrationApiKeyJwtPaylaod, IntegrationTypeEnum } from '@multiplayer/types'
import { JwtToken } from '@multiplayer/util'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { ForbiddenError } from 'restify-errors'
import { INTEGRATION_JWT_SECRET } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(String(req.user?._id), workspaceId)
    if (!workspaceUser)
      return next(new ForbiddenError('Workspace user not found'))

    const integrationPayload = {
      _id: new ObjectId(),
      expireAt: new Date(Date.now() + 10 * 60 * 1000),
      workspace: workspaceId,
      project: projectId,
      type: IntegrationTypeEnum.OTEL,
      workspaceUser: workspaceUser._id,
      metadata: {
        apiKey: '',
        otel: {
          autoMergeEnabled: false,
          autoCreateRelease: false,
        },
      },
    }

    const jwtPayload: IIntegrationApiKeyJwtPaylaod = {
      integration: integrationPayload._id.toString(),
      workspace: workspaceId,
      project: projectId,
      type: integrationPayload.type,
    }

    integrationPayload.metadata.apiKey = JwtToken.generateJwtToken(
      jwtPayload,
      INTEGRATION_JWT_SECRET,
      { expiresIn: 600 },
    )

    await IntegrationModel.createIntegration(integrationPayload)
    return res.status(200).json(integrationPayload.metadata.apiKey)
  } catch (err) {
    return next(err)
  }
}
