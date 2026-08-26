import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    let integration = req.integration
    const payload = req.body

    integration = await IntegrationModel.updateIntegrationById(
      integration._id,
      payload,
    ) as IIntegrationDocument

    return res.status(200).json(integration)
  } catch (err) {
    return next(err)
  }
}
