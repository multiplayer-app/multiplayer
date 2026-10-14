import type { Request, Response, NextFunction } from 'express'
import {
  IIntegrationApiKeyJwtPaylaod,
} from '@multiplayer/types'
import { JwtToken } from '@multiplayer/util'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { INTEGRATION_JWT_SECRET } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let integration = req.integration

    const jwtPayload: IIntegrationApiKeyJwtPaylaod = {
      integration: integration._id.toString(),
      workspace: integration.workspace as string,
      project: integration.project as string,
      type: integration.type,
    }

    const apiKey = JwtToken.generateJwtToken(
      jwtPayload,
      INTEGRATION_JWT_SECRET,
    )

    const updatePayload = {
      otel: {
        apiKey,
      },
    }

    integration = await IntegrationModel.updateIntegrationById(
      integration._id,
      updatePayload,
    ) as IIntegrationDocument

    const integrationObject = integration.toObject()

    integrationObject.otel = {
      ...(integrationObject.otel || {}),
      apiKey,
    }

    return res.status(200).json(integrationObject)
  } catch (err) {
    return next(err)
  }
}
