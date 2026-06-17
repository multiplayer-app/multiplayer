import { Joi } from '@multiplayer/util'
import {
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  AlertRuleFilterCondition,
} from '@multiplayer/types'


export const listAlertRulesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getAlertRuleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    alertRuleId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createAlertRuleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    enabled: Joi.boolean().required(),

    scope: Joi.object({
      environmentName: Joi.string().max(100),
      componentName: Joi.string().max(100),
    }),
    conditionOperator: Joi.string().valid('ALL', 'ANY').required(),

    conditions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleConditionType)).required(),
        interval: Joi.string().max(100),
        value: Joi.number(),
      }),
    )
      .min(1)
      .required(),

    filterOperator: Joi.string().valid('ALL', 'ANY', 'NONE').required(),
    filters: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleFilterType)).required(),
        interval: Joi.string().max(100),
        attribute: Joi.string().max(100),
        match: Joi.string().valid(...Object.values(AlertRuleFilterCondition)),
        value: Joi.string(),
      }),
    ),

    actions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleActionType)).required(),

        integration: Joi.string().hex().length(24)
          .when('type', {
            is: AlertRuleActionType.SEND_SLACK_NOTIFICATION,
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),

        slack: Joi.object({
          channelId: Joi.string().max(100),
          channelName: Joi.string().max(100),

          workspace: Joi.string().required(),

          notes: Joi.string().max(500),
          tags: Joi.string().max(200),
        }),
      }),
    )
      .min(1)
      .required(),
  }).required(),
})

export const updateAlertRuleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    alertRuleId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    enabled: Joi.boolean(),

    scope: Joi.object({
      environmentName: Joi.string().max(100),
      componentName: Joi.string().max(100),
    }),
    conditionOperator: Joi.string().valid('ALL', 'ANY'),

    conditions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleConditionType)).required(),
        interval: Joi.string().max(100),
        value: Joi.number(),
      }),
    ).min(1),

    filterOperator: Joi.string().valid('ALL', 'ANY', 'NONE'),
    filters: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleFilterType)).required(),
        interval: Joi.string().max(100),
        attribute: Joi.string().max(100),
        match: Joi.string().valid(...Object.values(AlertRuleFilterCondition)),
        value: Joi.string(),
      }),
    ),

    actions: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(AlertRuleActionType)).required(),
        integration: Joi.string().hex().length(24)
          .when('type', {
            is: AlertRuleActionType.SEND_SLACK_NOTIFICATION,
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),

        slack: Joi.object({
          channelId: Joi.string().max(100),
          channelName: Joi.string().max(100),

          workspace: Joi.string().required(),

          notes: Joi.string().max(500),
          tags: Joi.string().max(200),
        }),
      }),
    ).min(1),
  }).required(),
})

export const removeAlertRuleSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    alertRuleId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const runAlertRuleActionTestSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    alertRuleId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    type: Joi.string().valid(...Object.values(AlertRuleActionType)).required(),
    integration: Joi.string().hex().length(24),

    slack: Joi.object({
      channelId: Joi.string().max(100).allow('', null),
      channelName: Joi.string().max(100).allow('', null),

      workspace: Joi.string().required(),

      notes: Joi.string().max(500).allow('', null),
      tags: Joi.string().max(200).allow('', null),
    }),
  }).required(),
})
