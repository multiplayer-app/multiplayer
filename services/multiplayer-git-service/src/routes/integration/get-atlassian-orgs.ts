import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { AtlassianApi } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let integration = req.integration
    let orgs

    try {
      orgs = await AtlassianApi.getOrgs(
        integration?.atlassian?.accessToken as string,
      )
    } catch (apiErr: any) {
      if (apiErr?.response?.code === 401) {
        const refreshedToken = await AtlassianApi.refreshAccessToken(
          integration?.atlassian?.refreshToken as string,
        )

        integration = await IntegrationModel.updateIntegrationById(
          integration._id,
          {
            atlassian: refreshedToken,
          },
        ) as IIntegrationDocument

        orgs = await AtlassianApi.getOrgs(
          integration?.atlassian?.accessToken as string,
        )
      } else {
        throw apiErr
      }
    }

    return res.status(200).json(orgs)
  } catch (err) {
    return next(err)
  }
}
