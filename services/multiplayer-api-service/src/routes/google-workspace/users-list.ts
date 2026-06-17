import type { Request, Response, NextFunction } from 'express'
import { WorkspaceUserModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { GoogleAuth } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.session.current)
    const { workspace } = req.query

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
      userId,
      workspace as string,
    )

    if (!workspaceUser) {
      throw new NotFoundError('Workspace-user not found')
    }

    if (!workspaceUser.googleWorkspaceToken.access_token) {
      throw new NotFoundError('Google workspace integration not setup')
    }

    const oAuth2Client = GoogleAuth.getOAuth2Client()
    oAuth2Client.setCredentials(workspaceUser.googleWorkspaceToken)

    if (
      workspaceUser?.googleWorkspaceToken?.expiry_date
      && new Date > new Date(workspaceUser.googleWorkspaceToken.expiry_date)
    ) {
      const refreshedAccessToken = await oAuth2Client.getAccessToken()

      await WorkspaceUserModel.updateWorkspaceUser(
        workspaceUser.user,
        workspaceUser.workspace,
        {
          googleWorkspaceToken: refreshedAccessToken.res?.data,
        },
      )

      oAuth2Client.setCredentials(refreshedAccessToken.res?.data)
    }

    const users = await GoogleAuth.getGoogleWorkspaceUsers(oAuth2Client)

    return res.status(200).json(users)
  } catch (err) {
    return next(err)
  }
}
