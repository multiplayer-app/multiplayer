import logger from '@multiplayer/logger'
import { SendNotificationMessage } from '@multiplayer/types'
import {
  buildEmailTemplate,
  sendEmail,
  buildSlackTemplate,
  slackLib,
} from './lib'

export const AmqpListener = async (message: SendNotificationMessage) => {
  const variables = message?.variables

  const {
    integration,
    slackChannelOptions,

    email,
    template,
    data,
    sendAt,
  } = variables as any

  if (message.variables.notificationType === 'SLACK') {
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
