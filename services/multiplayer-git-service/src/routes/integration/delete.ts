import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationModel,
  GitRepositoryModel,
  AlertRuleModel,
} from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
} from '@multiplayer/types'
import {
  GitHubApp,
  GitRepositoryLib,
  SlackLib,
} from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { integration } = req
    const workspaceId = req.params.workspaceId as string
    const integrationId = req.params.integrationId as string

    const foundRepos = await GitRepositoryModel.findGitRepositories({
      gitRepositoryType: integration.type,
      workspace: workspaceId,
      gitRepositoryPrivate: true,
    })

    // chunking can be required
    await Promise.all(foundRepos.data.map((repo) =>
      GitRepositoryLib.deleteGitRepositoryWithRelations(repo, integration)))

    await IntegrationModel.deleteIntegrationById(integrationId)

    if (
      integration.type === IntegrationTypeEnum.GITHUB
      && integration.authType === IntegrationAuthTypeEnum.GITHUB_APP
      && integration?.github?.installationId
    ) {
      const existingGithubApp = await IntegrationModel.findIntegrationByGithubInstallationId(
        integration.github.installationId,
      )

      if (existingGithubApp) {
        await GitHubApp.deleteInstallation(integration.github.installationId)
      }
    } else if (integration.type === IntegrationTypeEnum.SLACK) {
      await Promise.all([
        AlertRuleModel.deleteActionsByIntegration(integrationId),
        integration.slack?.accessToken && SlackLib.uninstallSlackApp(integration.slack?.accessToken as string),
      ])
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
