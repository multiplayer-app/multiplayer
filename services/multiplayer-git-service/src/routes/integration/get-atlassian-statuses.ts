import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { AtlassianApi } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId } = req.query
    let integration = req.integration
    let statuses

    try {
      statuses = await AtlassianApi.getStatuses(
        integration?.atlassian?.accessToken as string,
        orgId as string,
      )

    } catch (apiErr: any) {
      if (apiErr?.response?.response?.code === 401) {
        const refreshedToken = await AtlassianApi.refreshAccessToken(
          integration?.atlassian?.refreshToken as string,
        )

        integration = await IntegrationModel.updateIntegrationById(
          integration._id,
          {
            atlassian: refreshedToken,
          },
        ) as IIntegrationDocument

        statuses = await AtlassianApi.getStatuses(
          integration?.atlassian?.accessToken as string,
          orgId as string,
        )
      } else {
        throw apiErr
      }
    }

    return res.status(200).json(statuses)
  } catch (err) {
    return next(err)
  }
}
