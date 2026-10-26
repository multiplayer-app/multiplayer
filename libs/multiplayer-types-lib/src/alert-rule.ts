import {
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  AlertRuleFilterCondition,
} from './enums'

export interface IAlertRule {
  _id: string

  workspace: string
  project: string

  name?: string
  enabled: boolean

  scope: {
    environmentName?: string
    componentName?: string
  }

  conditionOperator: 'ALL' | 'ANY'
  conditions: {
    type: AlertRuleConditionType
    interval?: string
    value?: string

    spanCount?: number
    affectedEndUsersCount?: number
  }[]

  filterOperator: 'ALL' | 'ANY' | 'NONE'
  filters: {
    type: AlertRuleFilterType
    interval?: string
    attribute?: string
    match?: AlertRuleFilterCondition
    value?: string
  }[]

  actions: {
    type: AlertRuleActionType
    integration?: string

    slack?: {
      channelId?: string
      channelName?: string

      workspace?: string

      notes?: string
      tags?: string
    }

    email?: {
      // Workspace members (workspace user ids); resolved to addresses when the alert is sent
      workspaceUsers: string[]
    }

    webhook?: {
      url: string
      // Write-only: signs deliveries and is never returned by the API (see hasSecret)
      secret?: string
      hasSecret?: boolean
    }

    teams?: {
      // Write-only: a Teams Workflows URL embeds its own credential (see hasWebhookUrl)
      webhookUrl?: string
      hasWebhookUrl?: boolean
    }

    slackWebhook?: {
      // Write-only: a Slack incoming webhook URL embeds its own credential (see hasWebhookUrl)
      webhookUrl?: string
      hasWebhookUrl?: boolean
    }
  }[]

  createdAt: string | Date
  updatedAt: string | Date
}
