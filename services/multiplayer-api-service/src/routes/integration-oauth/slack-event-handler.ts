import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body

    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge })
    } else if (body?.event?.type === 'app_uninstalled') {
      await IntegrationModel.deleteIntegrationBySlackTeamId(body?.team_id)
    }

    return res.status(200).json({ staus: 'ok' })
  } catch (error) {
    return next(error)
  }
}
