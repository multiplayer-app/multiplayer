import type { Request, Response, NextFunction } from 'express'
import { SlackLib } from '../../libs'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user?._id)
    const workspace = req.query.workspace as string | undefined
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/dashboard/${workspace}/settings/integrations`

    if (!workspace) {
      throw new Error('Workspace is required')
    }

    const state = {
      workspace,
      redirectUrl,
      userId,
    }

    const installationUrl = await SlackLib.getSlackInstallationUrl(state)

    return res.redirect(installationUrl)
  } catch (err) {
    next(err)
  }
}
