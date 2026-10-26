import {
  AlertRuleModel,
  IIssueDocument,
  IDebugSessionDocument,
  ProjectModel,
  WorkspaceModel,
  AlertHistoryModel,
  IssueEndUserModel,
  WorkspaceUserModel,
  findStoredAction,
} from '@multiplayer/models'
import {
  IAlertRule,
  OtelSpanCh,
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  NotificationType,
  SendNotificationMessage,
  ErrorMessage,
  IIssue,
  IDebugSession,
  MetricName,
  AlertRuleFilterCondition,
} from '@multiplayer/types'
import durationToMs from 'duration-to-ms'
import logger from '@multiplayer/logger'
import redis from '@multiplayer/redis'
import {
  slugifyString,
  getNestedProperty,
} from '@multiplayer/util-shared'
import {
  InvalidArgumentError,
  NotFoundError,
} from 'restify-errors'
import { AlertRulesCache } from '../cache'
import { REDIS_ALERT_THRESHOLD_COOLDOWN_PREFIX } from '../config'
import * as MetricsService from './metrics.service'
import { InternalNotificationService } from './notification.internal.service'

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

// Conditions fired by an explicit issue state change rather than by an issue occurrence.
const ISSUE_TRANSITION_CONDITION_TYPES: AlertRuleConditionType[] = [
  AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
  AlertRuleConditionType.ISSUE_UNARCHIVED,
  AlertRuleConditionType.NEW_ISSUE_SEVERITY_MARKED_AS_HIGH,
  AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH,
]

const THRESHOLD_CONDITION_TYPES: AlertRuleConditionType[] = [
  AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN,
  AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN,
]

const MIN_THRESHOLD_COOLDOWN_SECONDS = 60

const isInScope = (alertRule: IAlertRule, payload: IAlertPayload) => !(
  (
    alertRule?.scope?.componentName
    && slugifyString(alertRule.scope.componentName) !== payload?.issue?.service.serviceNameSlug
  ) || (
    alertRule?.scope?.environmentName
    && slugifyString(alertRule.scope.environmentName) !== payload?.issue?.service.environmentSlug
  )
)

// A crossed threshold stays crossed for a while: alert once per rule, issue and interval rather
// than on every following occurrence. Other conditions fire once per event by nature.
const isOutOfThresholdCooldown = async (alertRule: IAlertRule, payload: IAlertPayload): Promise<boolean> => {
  const thresholdConditions = alertRule.conditions.filter(({ type }) => THRESHOLD_CONDITION_TYPES.includes(type))

  if (payload.conditionType || !thresholdConditions.length || !payload.issue?.componentHash) {
    return true
  }

  const cooldownSeconds = Math.max(
    MIN_THRESHOLD_COOLDOWN_SECONDS,
    ...thresholdConditions.map(({ interval }) => Math.floor(durationToMs(interval || '') / 1000) || 0),
  )

  return redis.lockKey(
    `${REDIS_ALERT_THRESHOLD_COOLDOWN_PREFIX}${alertRule._id}:${payload.issue.componentHash}`,
    cooldownSeconds,
  )
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

// What each kind of alert event must carry
const assertAlertPayload = ({ conditionType, issue, span, sessionRecording }: IAlertPayload) => {
  if (conditionType === AlertRuleConditionType.SESSION_RECORDING_CREATED) {
    if (!sessionRecording) throw new InvalidArgumentError('Session recording is required')
    return
  }

  // Fixes and state changes come from agents and users, not occurrences: there is no span
  if (
    conditionType === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED
    || (conditionType && ISSUE_TRANSITION_CONDITION_TYPES.includes(conditionType))
  ) {
    if (!issue) throw new InvalidArgumentError('Issue is required')
    return
  }

  if ((!issue || !span) && !sessionRecording) {
    throw new InvalidArgumentError('Issue and span are required')
  }
}

export const checkAlertRules = async (
  workspaceId: string,
  projectId: string,
  payload: IAlertPayload,
): Promise<IAlertRule[]> => {
  assertAlertPayload(payload)

  // Thresholds are evaluated on occurrences only - a regression alert accompanies the
  // occurrence alert for the same span and must not count it twice.
  const isTransitionEvent = Boolean(payload.conditionType && ISSUE_TRANSITION_CONDITION_TYPES.includes(payload.conditionType))

  // Out-of-scope rules are dropped before their thresholds cost a query each
  let alertRules: IAlertRule[] = (await getAlertRules(workspaceId, projectId))
    .filter(alertRule => isInScope(alertRule, payload))

  alertRules = isTransitionEvent ? alertRules : await Promise.all(alertRules.map(async (alertRule) => {
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
      } else if (
        condition.type === AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN
        && payload?.issue?.componentHash
      ) {
        const affectedEndUserHashes = await IssueEndUserModel.distinct('endUser.hash', {
          workspace: workspaceId,
          project: projectId,
          'issue.componentHash': payload.issue.componentHash,
          lastSeen: { $gte: new Date(new Date().getTime() - durationToMs(condition.interval || '')) },
        })

        condition.affectedEndUsersCount = affectedEndUserHashes.length
      }

      return condition
    }))

    return alertRule
  }))

  const matchingAlertRules = alertRules.filter((alertRule) => {
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
        && !isTransitionEvent
        && (condition.spanCount || 0) >= (Number(condition.value) || 0)
      ) {
        return true
      } else if (
        condition.type === AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN
        && !isTransitionEvent
        && (condition.affectedEndUsersCount || 0) >= (Number(condition.value) || 0)
      ) {
        return true
      } else if (
        ISSUE_TRANSITION_CONDITION_TYPES.includes(condition.type)
        && payload.conditionType === condition.type
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

type AlertRuleActions = IAlertRule['actions']
type NotificationContent = Pick<SendNotificationMessage['variables'], 'template' | 'data'>

// The notifications an alert action delivers (one per target); undefined for an unsupported type
const buildNotifications = async (
  workspaceId: string,
  action: AlertRuleActions[number],
  getStoredAction: () => Promise<AlertRuleActions[number] | undefined>,
  content: NotificationContent,
): Promise<SendNotificationMessage['variables'][] | undefined> => {
  switch (action.type) {
    case AlertRuleActionType.SEND_SLACK_NOTIFICATION:
      return [{
        notificationType: NotificationType.SLACK,
        integration: action.integration,
        slackChannelOptions: action.slack,
        ...content,
        data: { ...content.data, slackChannelOptions: action.slack },
      }]

    case AlertRuleActionType.SEND_EMAIL_NOTIFICATION: {
      // Only active members of this workspace receive alerts, whatever ids the rule holds
      const workspaceUsers = await WorkspaceUserModel.findActiveWorkspaceUsersByIds(
        workspaceId,
        action.email?.workspaceUsers || [],
      )

      return workspaceUsers
        .filter(workspaceUser => (workspaceUser.user as any)?.primaryEmail)
        .map(workspaceUser => ({
          notificationType: NotificationType.EMAIL,
          email: (workspaceUser.user as any).primaryEmail,
          ...content,
        }))
    }

    case AlertRuleActionType.SEND_WEBHOOK_NOTIFICATION: {
      if (!action.webhook?.url) {
        return []
      }

      const secret = action.webhook.secret || (await getStoredAction())?.webhook?.secret

      return [{ notificationType: NotificationType.WEBHOOK, webhookOptions: { url: action.webhook.url, secret }, ...content }]
    }

    case AlertRuleActionType.SEND_TEAMS_NOTIFICATION: {
      const webhookUrl = action.teams?.webhookUrl || (await getStoredAction())?.teams?.webhookUrl

      return webhookUrl
        ? [{ notificationType: NotificationType.TEAMS, teamsOptions: { webhookUrl }, ...content }]
        : []
    }

    case AlertRuleActionType.SEND_SLACK_WEBHOOK_NOTIFICATION: {
      const webhookUrl = action.slackWebhook?.webhookUrl || (await getStoredAction())?.slackWebhook?.webhookUrl

      return webhookUrl
        ? [{ notificationType: NotificationType.SLACK_WEBHOOK, slackWebhookOptions: { webhookUrl }, ...content }]
        : []
    }

    default:
      return undefined
  }
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
    const checkedAlertRules = await checkAlertRules(
      workspaceId,
      projectId,
      payload,
    )

    matchingAlertRules = (await Promise.all(checkedAlertRules.map(async alertRule => (
      await isOutOfThresholdCooldown(alertRule, payload) ? alertRule : undefined
    )))).filter((alertRule): alertRule is IAlertRule => Boolean(alertRule))
  }

  // Most occurrences match no rule: the project and workspace are only needed to notify
  if (!matchingAlertRules.length) {
    return
  }

  const project = await ProjectModel.findProjectById(projectId)

  if (!project) {
    throw new NotFoundError(ErrorMessage.PROJECT_NOT_FOUND)
  }

  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  if (!workspace) {
    throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
  }

  return Promise.all(matchingAlertRules.map(async (alertRule) => {
    await AlertHistoryModel.createAlertHistory({
      workspace: workspaceId,
      project: projectId,
      alertRule: alertRule._id,
    })

    const content: NotificationContent = {
      // State-change events render their own template; occurrences use the rule's first condition
      template: payload.conditionType || alertRule.conditions[0].type,
      data: {
        ...payload,
        spanCount: alertRule.conditions
          .find(({ type }) => type === AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN)?.spanCount,
        affectedEndUsersCount: alertRule.conditions
          .find(({ type }) => type === AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN)?.affectedEndUsersCount,
        project: project.toObject(),
        workspace: workspace.toObject(),
        alertRuleName: alertRule.name,
        interval: alertRule.conditions
          .find(({ type }) => [
            AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN,
            AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN,
          ].includes(type))?.interval,
      },
    }

    // Cached rules carry no credentials; load them once, and only if a channel needs them.
    // The promise is memoized because the rule's actions are dispatched concurrently.
    let storedActions: Promise<AlertRuleActions> | undefined
    const getStoredAction = async (index: number) => {
      storedActions ??= AlertRuleModel.findAlertRuleCredentials(alertRule._id, projectId, workspaceId)
        .then(stored => stored?.actions || [])

      return findStoredAction(alertRule.actions, index, await storedActions)
    }

    await Promise.all(alertRule.actions.map(async (action, index) => {
      const notifications = await buildNotifications(workspaceId, action, () => getStoredAction(index), content)

      if (!notifications) {
        // An unsupported action must not abort the rule's other actions or the issue
        // pipeline awaiting this alert; only the "test alert rule" endpoint surfaces it.
        if (test) {
          throw new InvalidArgumentError('Invalid action type')
        }

        logger.error({ alertRuleId: alertRule._id, actionType: action.type }, '[ALERT] Unsupported alert action type')
        return
      }

      const notificationService = new InternalNotificationService()

      // `test` mode wants the caller (the "test this alert rule" endpoint) to see
      // success/failure synchronously, same as the old AMQP.request round-trip did.
      // Otherwise this is fired off, not awaited, same as the old AMQP.publish did.
      if (test) {
        await Promise.all(notifications.map(variables => notificationService.sendNotification(variables)))
        return
      }

      for (const variables of notifications) {
        notificationService.sendNotification(variables)
          .catch(err => logger.error(err, `[ALERT] Failed to send ${variables.notificationType} notification`))
      }
    }))
  },
  ))
}
