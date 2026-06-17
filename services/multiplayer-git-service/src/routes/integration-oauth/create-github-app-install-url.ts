import type { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'
import base64url from 'base64url'
import { OAuthStateCache } from '../../cache'
// import { ForbiddenError } from 'restify-errors'
// import { WorkspaceUserModel, IntegrationModel } from '@multiplayer/models'
// import {
//   IntegrationTypeEnum,
//   IntegrationAuthTypeEnum,
// } from '@multiplayer/types'
import { GitHubApp } from '../../libs'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user?._id)
    const workspace = req.query.workspace as string | undefined
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/dashboard/${workspace}/settings/integrations`

    const state = {
      workspace,
      redirectUrl,
      userId,
    }

    const oauthState = await OAuthStateCache.set(state)

    // const workspaceUsers = await WorkspaceUserModel.findWorkspaceUsersByUserId(userId, { _id: 1 })
    // const existingIntegration = await IntegrationModel.findIntegrationByUserAndType(
    //   workspaceUsers.map(({ _id }) => _id),
    //   IntegrationTypeEnum.GITHUB,
    //   IntegrationAuthTypeEnum.GITHUB_APP,
    // )
    // if (existingIntegration) {
    //   const {
    //     _id,
    //     createdAt,
    //     updatedAt,
    //     ..._integration
    //   } = existingIntegration.toObject()
    //   const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
    //     userId,
    //     workspace as string,
    //   )
    //   if (!workspaceUser) {
    //     throw new ForbiddenError()
    //   }
    //   const githubAppInstallation = await GitHubApp.getInstallation(existingIntegration?.metadata?.installationId as number)
    //   _integration.workspace = workspace as string
    //   _integration.workspaceUser = workspaceUser._id
    //   _integration.metadata = {
    //     ...(_integration.metadata || {}),
    //     integrationSettingsUrl: githubAppInstallation.data.html_url,
    //   }
    //   await IntegrationModel.createIntegration(_integration)
    //   return res.redirect(redirectUrl as string)
    // }

    const pkceMethod = 'S256'

    const challenge = base64url(crypto.createHash('sha256').update(oauthState.code_verifier as string).digest())

    const ghAppInstallUrl = await GitHubApp.getInstallationUrl(
      oauthState._id,
      {
        codeChallenge: challenge,
        codeChallengeMethod: pkceMethod,
      },
    )

    return res.redirect(ghAppInstallUrl)
  } catch (err) {
    return next(err)
  }
}
