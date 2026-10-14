import {
  InstallProvider,
  Installation,
  OrgInstallation,
  InstallURLOptions,
} from '@slack/oauth'
import type { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
import axios from 'axios'
import { WebClient } from '@slack/web-api'
import { InvalidArgumentError } from 'restify-errors'
import {
  IntegrationModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
} from '@multiplayer/types'
import crypto from 'crypto'
import { OAuthStateCache } from '../cache'
import {
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SIGNING_SECRET,
} from '../config'

const scopes = [
  'channels:read',
  'chat:write',
  'chat:write.customize',
  'chat:write.public',
  'commands',
  'groups:read',
  'im:history',
  'im:read',
  'links:read',
  'links:write',
  'team:read',
  'users:read',
]

const installer = new InstallProvider({
  authVersion: 'v2',
  clientId: SLACK_CLIENT_ID as string,
  clientSecret: SLACK_CLIENT_SECRET as string,
  installUrlOptions: { scopes },
  legacyStateVerification: true,
  stateStore: {
    generateStateParam: async (installUrlOptions, date) => {
      const { workspace } = JSON.parse(installUrlOptions.metadata as string)

      const state = await OAuthStateCache.set({
        ...installUrlOptions as any,
        workspace,
      })

      return state._id.toString()
    },
    verifyStateParam: async (date, state: string) => {
      const _state = await OAuthStateCache.get(state)

      if (!_state) {
        throw new Error('Invalid state parameter')
      }

      return {
        ..._state,
        scopes: _state.scopes || [],
      }
    },
  },
})

export const getSlackInstallationUrl = (state: {
  userId: string,
  workspace: string,
  redirectUrl: string
}) => {
  return installer.generateInstallUrl({
    metadata: JSON.stringify(state),
    scopes,
  })
}

export const handleCallback = (request: Request, response: Response) => {
  const callbackOptions = {
    failure: (error, installOptions, _request, _response) => {
      return _response.status(500).json({ error })
    },
    legacyStateVerification: true,
    success: async (
      installation: Installation | OrgInstallation,
      installOptions: InstallURLOptions,
      req,
      res,
    ) => {
      const {
        workspace,
        redirectUrl,
        userId,
      } = JSON.parse(req.oauthState?.metadata || '{}')

      const existingSlackIntegration = await IntegrationModel.findIntegrationInWorkspace(
        workspace,
        IntegrationTypeEnum.SLACK,
      )

      if (existingSlackIntegration) {
        return response.redirect(`${redirectUrl}?success=false&message=${encodeURIComponent('Slack integration already exists for that workspace.')}`)
      }

      const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
        userId,
        workspace,
      )

      if (!workspaceUser) {
        throw new InvalidArgumentError('Workspace user not found')
      }

      if (!installation?.bot?.token) {
        throw new Error('Failed to get access token from Slack')
      }

      const web = new WebClient(installation?.bot?.token)

      const workspaceInfo = await web.team.info()

      if (!workspaceInfo?.team?.name) {
        throw new Error('Failed to get workspace name from Slack')
      }

      await IntegrationModel.createIntegration({
        workspace,
        type: IntegrationTypeEnum.SLACK,
        authType: IntegrationAuthTypeEnum.OAUTH,
        workspaceUser: workspaceUser?._id,
        slack: {
          accessToken: installation?.bot?.token,
          integrationSettingsUrl: installation?.incomingWebhook?.configurationUrl,
          incomingWebhook: installation?.incomingWebhook?.url,
          ...installation.isEnterpriseInstall
            ? { enterpriseId: installation?.enterprise?.id }
            : { teamId: installation?.team?.id },
          teamName: workspaceInfo?.team?.name,
        },
      })

      return response.redirect(`${redirectUrl}?success=true`)
    },
  }

  return installer.handleCallback(request, response, callbackOptions)
}

export const sendMessageToChannel = async (endpoint, text, plainText) => {
  await axios.post(endpoint, {
    blocks: [{
      text: { text, type: 'mrkdwn' },
      type: 'section',
    }],
    text: plainText,
  },
  )
}

export const sendDirectMessage = async (email, accessToken, text, plainText) => {
  const web = new WebClient(accessToken)
  const slackUser = await web.users.lookupByEmail({ email }).catch(() => false)

  if (
    !slackUser
    || typeof slackUser !== 'object'
    || !slackUser?.user?.id
  ) {
    logger.warn(`User with email ${email} not found in slack. Skipping sending DM.`)
    return false
  }

  const channel = await web.conversations.open({ users: slackUser?.user.id })

  if (!channel?.channel?.id) {
    logger.warn(`Cannot open conversation with user ${slackUser?.user.id}. Skipping sending DM.`)
    return false
  }

  await web.chat.postMessage({
    blocks: [{
      text: {
        text,
        type: 'mrkdwn',
      },
      type: 'section',
    }],
    channel: channel.channel.id,
    text: plainText,
  })

  return true
}

export const verifySlackWebhookMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.headers['x-slack-request-timestamp'] ||
    Math.abs(
      Math.floor(new Date().getTime() / 1000) -
      +req.headers['x-slack-request-timestamp'],
    ) > 300
  ) {
    return res.status(400).send('Request too old!')
  }

  const baseStr = `v0:${req.headers['x-slack-request-timestamp']}:${req.rawBody}`

  const receivedSignature = req.headers['x-slack-signature']

  const expectedSignature = `v0=${crypto
    .createHmac('sha256', SLACK_SIGNING_SECRET as string)
    .update(baseStr, 'utf8')
    .digest('hex')}`

  if (expectedSignature !== receivedSignature) {
    logger.error('SLACK WEBHOOK SIGNATURE MISMATCH!')

    throw new Error('SLACK WEBHOOK SIGNATURE MISMATCH')
  }

  return next()
}

export const uninstallSlackApp = async (accessToken: string) => {
  const web = new WebClient(accessToken)
  await web.apps.uninstall({
    client_id: SLACK_CLIENT_ID as string,
    client_secret: SLACK_CLIENT_SECRET as string,
  })
}
