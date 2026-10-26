import logger from '@multiplayer/logger'
import { AlertRuleConditionType, NotificationType, SendNotificationMessage } from '@multiplayer/types'
import { describeAlert } from './alert-content'
import { buildEmailTemplate } from './email-templates'
import { sendEmail } from './postmark.lib'
import { buildSlackTemplate } from './slack-templates'
import * as slackLib from './slack.lib'
import { sendSlackWebhookNotification } from './slack-webhook.lib'
import { sendTeamsNotification } from './teams.lib'
import { sendWebhookNotification } from './webhook.lib'

const ALERT_TEMPLATES = new Set<string>(Object.values(AlertRuleConditionType))

const MAX_SUBJECT_LENGTH = 200

// Alert rule emails share one template rendered from the channel-agnostic alert description
const buildAlertEmail = (template: string, data: any) => {
  const content = describeAlert(template, data)
  const subject = `${data?.project?.name ? `[${data.project.name}] ` : ''}${content.headline}: ${content.title}`
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SUBJECT_LENGTH)

  return buildEmailTemplate('ALERT', {
    ...content,
    subject,
    project: data?.project,
    workspace: data?.workspace,
    alertRuleName: data?.alertRuleName,
  })
}

export const sendNotification = async (variables: SendNotificationMessage['variables']) => {
  const {
    integration,
    slackChannelOptions,
    webhookOptions,
    teamsOptions,
    slackWebhookOptions,

    email,
    template,
    data,
    sendAt,
  } = variables

  switch (variables.notificationType) {
    case NotificationType.SLACK: {
      const message = buildSlackTemplate(template, data)

      await slackLib.sendSlackNotification(
        integration,
        slackChannelOptions,
        message,
      )
      logger.info(`Successfully sent ${template} slack notification`)
      return
    }

    case NotificationType.SLACK_WEBHOOK: {
      if (!slackWebhookOptions) {
        throw new Error('Slack webhook options are required')
      }

      await sendSlackWebhookNotification(slackWebhookOptions, template, data)
      logger.info(`Successfully sent ${template} slack webhook notification`)
      return
    }

    case NotificationType.WEBHOOK: {
      if (!webhookOptions) {
        throw new Error('Webhook options are required')
      }

      await sendWebhookNotification(webhookOptions, template, data)
      logger.info(`Successfully sent ${template} webhook notification`)
      return
    }

    case NotificationType.TEAMS: {
      if (!teamsOptions) {
        throw new Error('Teams options are required')
      }

      await sendTeamsNotification(teamsOptions, template, data)
      logger.info(`Successfully sent ${template} teams notification`)
      return
    }

    default: {
      const { html, subject } = ALERT_TEMPLATES.has(template)
        ? buildAlertEmail(template, data)
        : buildEmailTemplate(template, data)

      await sendEmail(email, subject, html, sendAt)
      logger.info(`Successfully sent ${template} email to ${email}`)
    }
  }
}
