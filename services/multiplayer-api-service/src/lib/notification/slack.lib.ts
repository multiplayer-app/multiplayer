
import logger from '@multiplayer/logger'
import { WebClient } from '@slack/web-api'
import { IAlertRule, IntegrationTypeEnum } from '@multiplayer/types'
import { IntegrationModel } from '@multiplayer/models'

export const sendMessageToChannel = async (
  accessToken: string,
  channelId: string,
  message: {
    blocks?: any[],
    attachments?: any[],
    plainText: string,
  },
) => {
  const web = new WebClient(accessToken)

  await web.chat.postMessage({
    channel: channelId,
    text: message.plainText,
    ...(message.blocks?.length ? { blocks: message.blocks } : {}),
    ...(message.attachments?.length ? { attachments: message.attachments } : {}),
  })

  return true
}

export const sendDirectMessage = async (
  email: string,
  accessToken: string,
  message: {
    blocks?: any[],
    attachments?: any[],
    plainText: string,
  },
) => {
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
    channel: channel.channel.id,
    text: message.plainText,
    ...(message.blocks?.length ? { blocks: message.blocks } : {}),
    ...(message.attachments?.length ? { attachments: message.attachments } : {}),
  })

  return true
}

export const getChannelIdByName = async (
  accessToken: string,
  channelName: string,
) => {
  try {
    const web = new WebClient(accessToken)
    let cursor: string | undefined

    do {
      const result = await web.conversations.list({
        limit: 1000,
        types: 'public_channel,private_channel',
        cursor,
        exclude_archived: true,
      })

      if (!result.ok || !result.channels) {
        logger.warn('Failed to fetch channels from Slack')
        return null
      }

      const channel = result.channels.find((ch) => ch.name === channelName)
      if (channel?.id) {
        return channel.id
      }

      cursor = result.response_metadata?.next_cursor
    } while (cursor)

    logger.warn(`Channel with name "${channelName}" not found in Slack workspace`)
    return null

  } catch (error) {
    logger.error(error, 'Error getting channel ID by name')
    return null
  }
}

export const sendSlackNotification = async (
  integrationId,
  slackChannelOptions: IAlertRule['actions'][number]['slack'],
  message: {
    blocks?: any[],
    attachments?: any[],
    plainText: string,
  },
) => {
  if (!integrationId) {
    throw new Error('Integration id missing')
  }

  if (!slackChannelOptions) {
    throw new Error('Slack channel options missing')
  }

  if (!message) {
    throw new Error('Message to send is missing')
  }

  const integration = await IntegrationModel.findIntegrationById(integrationId)

  if (!integration) {
    throw new Error('Integration not found')
  }

  if (
    integration.type !== IntegrationTypeEnum.SLACK
    || !integration.slack?.accessToken
  ) {
    throw new Error('Incorrect integration type')
  }

  let channelId

  if (slackChannelOptions.channelId) {
    channelId = slackChannelOptions.channelId
  } else if (slackChannelOptions.channelName) {
    channelId = await getChannelIdByName(
      integration.slack.accessToken,
      slackChannelOptions.channelName,
    )
  } else {
    throw new Error('Channel ID or channel name is required')
  }

  if (!channelId) {
    throw new Error('Channel ID not found')
  }

  await sendMessageToChannel(
    integration.slack.accessToken,
    channelId,
    message,
  )
}
