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
  }[]

  createdAt: string | Date
  updatedAt: string | Date
}
