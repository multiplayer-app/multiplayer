import {
  AlertRuleModel,
  IIssueDocument,
  IDebugSessionDocument,
  ProjectModel,
  WorkspaceModel,
  AlertHistoryModel,
} from '@multiplayer/models'
import {
  IAlertRule,
  OtelSpanCh,
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  SendNotificationMessage,
  ErrorMessage,
  IIssue,
  IDebugSession,
  MetricName,
  AlertRuleFilterCondition,
} from '@multiplayer/types'
import durationToMs from 'duration-to-ms'
import AMQP from '@multiplayer/amqp'
import {
  slugifyString,
  getNestedProperty,
} from '@multiplayer/util-shared'
import {
  InvalidArgumentError,
  NotFoundError,
} from 'restify-errors'
import { AlertRulesCache } from '../cache'
import * as MetricsService from './metrics.service'
import { AMQP_NOTIFICATION_QUEUE } from '../config'

interface IAlertPayload {
  issue?: IIssueDocument | IIssue,
  span?: OtelSpanCh,
  sessionRecording?: IDebugSessionDocument | IDebugSession,
  git?: {
    branchName: string,
    branchUrl?: string,
    repositoryUrl: string,
    prUrl?: string,
    codeChanges?: { additions?: number, deletions?: number },
  },
  conditionType?: AlertRuleConditionType
}

export const getAlertRules = async (
  workspaceId: string,
  projectId: string,
): Promise<IAlertRule[]> => {
  let alertRules = await AlertRulesCache.get(projectId)

  if (!alertRules) {
    const {
      data: _alertRules = [],
    } = await AlertRuleModel.findAlertRules({
      workspace: workspaceId,
      project: projectId,
      enabled: true,
    })

    await AlertRulesCache.set(
      projectId,
      _alertRules as any as IAlertRule[],
    )

    alertRules = _alertRules as any as IAlertRule[]
  }

  return alertRules
}

export const checkAlertRules = async (
  workspaceId: string,
  projectId: string,
  payload: IAlertPayload,
): Promise<IAlertRule[]> => {
  if (
    payload.conditionType === AlertRuleConditionType.SESSION_RECORDING_CREATED
    && !payload.sessionRecording
  ) {
    throw new InvalidArgumentError('Session recording is required')
  } else if (
    payload.conditionType === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED
    && !payload.issue
  ) {
    throw new InvalidArgumentError('Issue is required')
  } else if (
    payload.conditionType !== AlertRuleConditionType.SESSION_RECORDING_CREATED
    && payload.conditionType !== AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED
    && (
      !payload.issue
      || !payload.span
    ) && !payload.sessionRecording
  ) {
    throw new InvalidArgumentError('Issue and span are required')
  }

  let alertRules: IAlertRule[] = await getAlertRules(workspaceId, projectId)

  alertRules = await Promise.all(alertRules.map(async (alertRule) => {
    alertRule.conditions = await Promise.all(alertRule.conditions.map(async (condition) => {
      if (
        condition.type === AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN
        && payload?.issue?.componentHash
      ) {
        condition.spanCount = await MetricsService.getCount(
          {
            metricName: MetricName.ISSUE_RATE,
            workspaceId,
            projectId,
            componentHash: { $in: [payload.issue.componentHash] },
          },
          new Date(new Date().getTime() - durationToMs(condition.interval || '')),
          new Date(),
        )
      }

      return condition
    }))

    return alertRule
  }))

  const matchingAlertRules = alertRules.filter((alertRule) => {
    if (
      alertRule?.scope?.componentName
      && slugifyString(alertRule.scope.componentName) !== payload?.issue?.service.serviceNameSlug
    ) {
      return false
    }

    if (
      alertRule?.scope?.environmentName
      && slugifyString(alertRule.scope.environmentName) !== payload?.issue?.service.environmentSlug
    ) {
      return false
    }

    const conditionFilter = alertRule.conditionOperator === 'ALL' ? 'every' : 'some'

    return alertRule.conditions[conditionFilter]((condition) => {
      if (
        condition.type === AlertRuleConditionType.NEW_ISSUE_CREATED
        && payload?.issue?.createdAt
        && payload?.issue?.updatedAt
        && new Date(payload?.issue?.createdAt).getTime() === new Date(payload.issue.updatedAt).getTime()
      ) {
        return true
      } else if (
        condition.type === AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN
        && (condition.spanCount || 0) >= (Number(condition.value) || 0)
      ) {
        return true
      } else if (
        condition.type === AlertRuleConditionType.SESSION_RECORDING_CREATED
        && payload.conditionType === AlertRuleConditionType.SESSION_RECORDING_CREATED
      ) {
        return true
      } else if (
        condition.type === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED
        && payload.conditionType === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED
      ) {
        return true
      }

      return false
    })
  }).filter((alertRule) => {
    const filterOperator = alertRule.filterOperator === 'ALL' ? 'every' : 'some'

    if (
      filterOperator === 'some'
      && alertRule.filters.length === 0
    ) {
      return true
    }

    const object = alertRule.conditions[0].type === AlertRuleConditionType.SESSION_RECORDING_CREATED
      ? payload?.sessionRecording
      : payload?.issue

    return alertRule.filters[filterOperator]((filter) => {
      if (
        payload?.issue?.createdAt
        && filter.type === AlertRuleFilterType.ISSUE_OLDER_THAN
        && payload?.issue?.createdAt
        && (durationToMs(filter.interval || '')) >= (new Date().getTime() - new Date(payload.issue.createdAt)?.getTime())
      ) {
        return true
      } else if (
        payload?.issue?.createdAt
        && payload?.issue?.createdAt
        && filter.type === AlertRuleFilterType.ISSUE_NEWER_THAN
        && (durationToMs(filter.interval || '')) < (new Date().getTime() - new Date(payload.issue.createdAt)?.getTime())
      ) {
        return true
      } else if (
        filter.type === AlertRuleFilterType.ATTRIBUTE_FILTER
        && filter.attribute
        && filter.match
        && filter.value
      ) {
        const attributeValue = getNestedProperty(object, filter.attribute) as string | number | boolean | undefined

        switch (filter.match) {
          case AlertRuleFilterCondition.EQUALS:
            return attributeValue === filter.value
          case AlertRuleFilterCondition.NOT_EQUALS:
            return attributeValue !== filter.value
          case AlertRuleFilterCondition.CONTAINS:
            return String(attributeValue)?.includes(filter.value)
          case AlertRuleFilterCondition.NOT_CONTAINS:
            return !String(attributeValue)?.includes(filter.value)
          case AlertRuleFilterCondition.EXISTS:
            return attributeValue !== undefined && attributeValue !== null
          case AlertRuleFilterCondition.NOT_EXISTS:
            return attributeValue === undefined || attributeValue === null
          default:
            return false
        }
      }

      return false
    })
  })

  return matchingAlertRules
}

export const sendAlert = async (
  workspaceId: string,
  projectId: string,
  payload: IAlertPayload,
  test: boolean = false,
  testingAlertRule?: IAlertRule,
) => {
  let matchingAlertRules: IAlertRule[] = []


  if (test) {
    if (!testingAlertRule) {
      throw new InvalidArgumentError('Alert rule is required when testing')
    }

    matchingAlertRules = [testingAlertRule]
  } else {
    matchingAlertRules = await checkAlertRules(
      workspaceId,
      projectId,
      payload,
    )
  }

  const project = await ProjectModel.findProjectById(projectId)

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }

  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  if (!workspace) {
    throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
  }

  if (!matchingAlertRules.length) {
    return
  }

  return Promise.all(matchingAlertRules.map(async (alertRule) => {
    await AlertHistoryModel.createAlertHistory({
      workspace: workspaceId,
      project: projectId,
      alertRule: matchingAlertRules[0]._id,
    })

    await Promise.all(alertRule.actions.map(async (action) => {
      if (action.type === AlertRuleActionType.SEND_SLACK_NOTIFICATION) {
        const amqpMethod = test ? 'request' : 'publish'

        return AMQP[amqpMethod](
          AMQP_NOTIFICATION_QUEUE,
          {
            variables: {
              notificationType: 'SLACK',

              integration: action.integration,
              slackChannelOptions: action.slack,

              template: alertRule.conditions[0].type,
              email: '',
              data: {
                ...payload,
                spanCount: alertRule.conditions
                  .find(({ type }) => type === AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN)?.spanCount,
                affectedEndUsersCount: alertRule.conditions
                  .find(({ type }) => type === AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN)?.affectedEndUsersCount,
                project: project.toObject(),
                workspace: workspace.toObject(),
                slackChannelOptions: action.slack,
                interval: alertRule.conditions
                  .find(({ type }) => [
                    AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN,
                    AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN,
                  ].includes(type))?.interval,
              },
            },
          } as SendNotificationMessage,
        )
      } else {
        throw new InvalidArgumentError('Invalid action type')
      }
    }))
  },
  ))
}
