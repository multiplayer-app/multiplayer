import { IAlertRule } from '../alert-rule'
import { NotificationType } from '../enums'
export interface SendNotificationMessage {
  variables: {
    notificationType?: NotificationType

    integration?: string
    slackChannelOptions?: IAlertRule['actions'][number]['slack'],
    webhookOptions?: { url: string, secret?: string },
    teamsOptions?: { webhookUrl: string },
    slackWebhookOptions?: { webhookUrl: string },

    template: string,
    email: string,
    data?: any,
    sendAt?: Date | string
  },
}
