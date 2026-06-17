import { IAlertRule } from '../alert-rule'
export interface SendNotificationMessage {
  variables: {
    notificationType?: 'EMAIL' | 'SLACK'

    integration?: string
    slackChannelOptions?: IAlertRule['actions'][number]['slack'],

    template: string,
    email: string,
    data?: any,
    sendAt?: Date | string
  },
}
