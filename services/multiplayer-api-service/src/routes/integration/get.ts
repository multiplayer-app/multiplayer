import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const integrationId = req.params.integrationId as string

    const integration = await IntegrationModel.findIntegrationByIdInWorkspace(
      integrationId,
      workspaceId,
    )

    return res.status(200).json(integration)
  } catch (err) {
    return next(err)
  }
}
