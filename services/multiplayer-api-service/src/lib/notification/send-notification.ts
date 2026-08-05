import logger from '@multiplayer/logger'
import { SendNotificationMessage } from '@multiplayer/types'
import { buildEmailTemplate } from './email-templates'
import { sendEmail } from './postmark.lib'
import { buildSlackTemplate } from './slack-templates'
import * as slackLib from './slack.lib'

export const sendNotification = async (variables: SendNotificationMessage['variables']) => {
  const {
    integration,
    slackChannelOptions,

    email,
    template,
    data,
    sendAt,
  } = variables

  if (variables.notificationType === 'SLACK') {
    const message = buildSlackTemplate(template, data)

    await slackLib.sendSlackNotification(
      integration,
      slackChannelOptions,
      message,
    )
    logger.info(`Successfully sent ${template} email to ${email}`)
  } else {
    const { html, subject } = buildEmailTemplate(template, data)

    await sendEmail(email, subject, html, sendAt)
    logger.info(`Successfully sent ${template} email to ${email}`)
  }
}
