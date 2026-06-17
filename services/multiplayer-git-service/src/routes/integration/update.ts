import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integrationId = req.params.integrationId as string
    const payload = req.body

    const integration = await IntegrationModel.updateIntegrationById(integrationId, payload)

    return res.status(200).json(integration)
  } catch (err) {
    return next(err)
  }
}
