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
    headlineColor: content.tone === 'success' ? '#2F9E44' : '#E01E5A',
    project: data?.project,
    workspace: data?.workspace,
    alertRuleName: data?.alertRuleName,
  })
}

export const sendNotification = async (variables: SendNotificationMessage['variables']) => {
  const { template, data } = variables

  // Each case narrows `variables` to its channel, whose options are then required
  switch (variables.notificationType) {
    case NotificationType.SLACK:
      await slackLib.sendSlackNotification(
        variables.integration,
        variables.slackChannelOptions,
        buildSlackTemplate(template, data),
      )
      break

    case NotificationType.SLACK_WEBHOOK:
      await sendSlackWebhookNotification(variables.slackWebhookOptions, template, data)
      break

    case NotificationType.WEBHOOK:
      await sendWebhookNotification(variables.webhookOptions, template, data)
      break

    case NotificationType.TEAMS:
      await sendTeamsNotification(variables.teamsOptions, template, data)
      break

    default: {
      const { html, subject } = ALERT_TEMPLATES.has(template)
        ? buildAlertEmail(template, data)
        : buildEmailTemplate(template, data)

      await sendEmail(variables.email, subject, html, variables.sendAt)
    }
  }

  logger.info({ template, notificationType: variables.notificationType || NotificationType.EMAIL }, 'Notification sent')
}
