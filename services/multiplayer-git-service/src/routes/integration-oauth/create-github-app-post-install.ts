import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  ErrorMessage,
} from '@multiplayer/types'
import { GitHubApp } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString() as string
    const oauthState = req.oauthState
    const { installation_id, setup_action } = req.query

    if (
      !oauthState.workspace
      || oauthState.userId?.toString() !== userId
      || setup_action !== 'install'
    ) {
      throw new InvalidArgumentError('Invalid state')
    }

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
      userId,
      oauthState.workspace,
    )

    if (!workspaceUser) {
      throw new InvalidArgumentError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }
    const installationId = Number(installation_id)

    const githubAppInstallation = await GitHubApp.getInstallation(installationId)

    await IntegrationModel.createIntegration({
      workspace: oauthState.workspace,
      type: IntegrationTypeEnum.GITHUB,
      authType: IntegrationAuthTypeEnum.GITHUB_APP,
      workspaceUser: workspaceUser?._id,
      github: {
        installationId: installationId,
        integrationSettingsUrl: githubAppInstallation.data.html_url,
        orgId: githubAppInstallation.data?.account?.id?.toString(),
        orgName: (githubAppInstallation.data?.account as any)?.login,
      },
    })

    const _redirectUrl = oauthState.redirectUrl

    return res.redirect(_redirectUrl)
  } catch (err) {
    return next(err)
  }
}
