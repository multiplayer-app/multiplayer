import type { Request, Response, NextFunction } from 'express'
import { IntegrationLib } from '../libs'

export const attachIntegration = async (req: Request, res: Response, next: NextFunction) => {
  const workspaceId = req.params.workspaceId as string
  const integrationId = req.params.integrationId as string

  const integration = await IntegrationLib.fetchIntegrationById(
    workspaceId,
    integrationId,
  )

  req.integration = integration

  next()
}
