import express from 'express'
import logger from '@multiplayer/logger'
import { authorize, expressSession } from '@multiplayer/auth'
import { App, createNodeMiddleware } from '@octokit/app'
import { createAppAuth } from '@octokit/auth-app'
import type { Octokit } from '@octokit/rest'
import {
  IntegrationModel,
  GitRepositoryModel,
} from '@multiplayer/models'
import { IntegrationValidationMiddleware } from '../middleware/validation'
import * as OAuthStateMiddleware from '../middleware/oauth-state'
import {
  GIT_GITHUB_APP_ID,
  GIT_GITHUB_APP_CLIENT_ID,
  GIT_GITHUB_APP_CLIENT_SECRET,
  GIT_GITHUB_APP_WEBHOOK_SECRET,
  GIT_GITHUB_APP_PRIVATE_KEY,
} from '../config'
import getGithubAppInstallUrl from '../routes/integration-oauth/create-github-app-install-url'
import githubAppPostInstall from '../routes/integration-oauth/create-github-app-post-install'
import githubWebhook from '../routes/webhook/webhook-github'

const githubAppAuth = createAppAuth({
  appId: GIT_GITHUB_APP_ID,
  privateKey: GIT_GITHUB_APP_PRIVATE_KEY,
  clientId: GIT_GITHUB_APP_CLIENT_ID,
  clientSecret: GIT_GITHUB_APP_CLIENT_SECRET,
})

let installationUrlBase: string

export const getInstallationToken = async (installationId: number) => {
  const installationAuthentication = await githubAppAuth({
    type: 'installation',
    installationId: installationId,
  })

  return installationAuthentication.token
}

export const githubApp = new App({
  appId: GIT_GITHUB_APP_ID,
  privateKey: GIT_GITHUB_APP_PRIVATE_KEY,
  oauth: {
    clientId: GIT_GITHUB_APP_CLIENT_ID,
    clientSecret: GIT_GITHUB_APP_CLIENT_SECRET,
  },
  webhooks: {
    secret: GIT_GITHUB_APP_WEBHOOK_SECRET,
  },
})

githubApp.webhooks.on('installation.deleted', async (event) => {
  await IntegrationModel.deleteIntegrationByGithubInstallationId(
    event.payload.installation.id,
  )

  if (event.payload.repositories?.length) {
    await GitRepositoryModel.deleteGitRepositories({
      gitRepositoryId: event.payload.repositories.map(({ id }) => id.toString()),
    })
  }
})

githubApp.webhooks.on('push', async (event) => {
  const { id, name, payload } = event
  const octokit = event.octokit as Octokit

  await githubWebhook({ id, name, payload, octokit })
})

githubApp.webhooks.on('repository.renamed', async (event) => {
  const { id, name, payload } = event
  const octokit = event.octokit as Octokit

  await githubWebhook({ id, name, payload, octokit })
})

// export const getAuthUrl = (options): Promise<string => {
//   return githubApp.oauth.getWebFlowAuthorizationUrl(options)
// }

// export const authCallback = (code: string) => {
//   return githubApp.oauth.createToken({ code })
// }

export const deleteInstallation = async (installationId: number) => {
  await githubApp.octokit.request(
    'DELETE /app/installations/{installation_id}', {
      installation_id: installationId,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
}

export const getInstallation = async (installationId: number): Promise<any> => {
  const installation = await githubApp.octokit.request('GET /app/installations/{installation_id}', {
    installation_id: installationId,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  return installation
}

const getInstallationUrlBase = async (): Promise<string> => {
  const { data: appInfo } = await githubApp.octokit.request('GET /app')
  if (!appInfo) {
    throw new Error('[@octokit/app] unable to fetch metadata for app')
  }

  return `${appInfo.html_url}/installations/new`
}

export const getInstallationUrl = async (
  state: string,
  pkceOptions?: {
    codeChallenge: string,
    codeChallengeMethod: string
  },
): Promise<string> => {
  // const url = await githubApp.getInstallationUrl({
  //   state,
  // })
  if (!installationUrlBase) {
    installationUrlBase = await getInstallationUrlBase()
  }

  let url = installationUrlBase

  if (Object.keys(state).length) {
    url += `?state=${state}`
  }

  if (pkceOptions?.codeChallenge && pkceOptions?.codeChallengeMethod) {
    if (Object.keys(state).length) {
      url += '&'
    } else {
      url += '?'
    }

    url += `code_challenge=${pkceOptions.codeChallenge}&code_challenge_method=${pkceOptions.codeChallengeMethod}`
  }

  return url
}

const { Router } = express
const router = Router()

const githubMiddleware = createNodeMiddleware(githubApp, {
  pathPrefix: '/integrations/github-app',
  log: logger,
})

router.get(
  '/integrations/github-app/install',
  expressSession(),
  authorize(),
  IntegrationValidationMiddleware.validateGetGithubAppIntegrationInstallUrlArgs,
  getGithubAppInstallUrl,
)

router.get(
  '/integrations/github-app/post-install',
  expressSession(),
  OAuthStateMiddleware.attachOAuthState,
  authorize(),
  IntegrationValidationMiddleware.validateGithubAppIntegrationPostInstallHookArgs,
  githubAppPostInstall,
)

router.use(githubMiddleware)

export const githubAppMiddleware = router
