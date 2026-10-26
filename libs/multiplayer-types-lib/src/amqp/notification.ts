import { IAlertRule } from '../alert-rule'
import { NotificationType } from '../enums'

interface NotificationContent {
  template: string
  data?: any
  sendAt?: Date | string
}

// Each channel's options are required by its own notification type; an email is the default
export type NotificationVariables = NotificationContent & (
  | { notificationType?: NotificationType.EMAIL, email: string }
  | {
    notificationType: NotificationType.SLACK
    integration?: string
    slackChannelOptions?: IAlertRule['actions'][number]['slack']
  }
  | { notificationType: NotificationType.WEBHOOK, webhookOptions: { url: string, secret?: string } }
  | { notificationType: NotificationType.TEAMS, teamsOptions: { webhookUrl: string } }
  | { notificationType: NotificationType.SLACK_WEBHOOK, slackWebhookOptions: { webhookUrl: string } }
)

export interface SendNotificationMessage {
  variables: NotificationVariables
}
