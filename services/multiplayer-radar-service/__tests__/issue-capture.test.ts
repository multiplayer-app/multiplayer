import mongo, { ObjectId } from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import { IssueModel, AlertRuleModel, IssueEndUserModel } from '@multiplayer/models'
import {
  AlertRuleConditionType,
  AlertRuleActionType,
  type IIssue,
} from '@multiplayer/types'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
} from '@multiplayer-app/session-recorder-node'
import * as IssueService from '../src/services/issue.service'
import * as AlertService from '../src/services/alert.service'
import * as DebugSessionService from '../src/services/debug-session.service'
import * as IntegrationService from '../src/services/integration.service'
import * as AgentService from '../src/services/agent.service'
import * as IssueSettingsLib from '../src/libs/issue-settings.lib'
import { AlertRulesCache } from '../src/cache'
import type { IExportTraceServiceRequest } from '../src/types'

// End-to-end behaviour of the error -> issue -> alert pipeline against real Mongo/Redis.
// Only the auto-created debug session (websocket fan-out), integration bookkeeping and the
// debugging-agent auto-fix flow are stubbed.

const WORKSPACE_ID = new ObjectId().toString()
const PROJECT_ID = new ObjectId().toString()
const INTEGRATION_ID = new ObjectId().toString()
// A plain OTel trace id: no Multiplayer session prefix, e.g. an API client or a queue consumer
const PLAIN_TRACE_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

const kv = (attributes: Record<string, string | number>) => Object.entries(attributes)
  .map(([key, value]) => ({ key, value: typeof value === 'number' ? { intValue: value } : { stringValue: value } }))

const buildErrorTrace = (spanId: string): IExportTraceServiceRequest => ({
  resourceSpans: [{
    resource: { attributes: kv({ 'service.name': 'checkout', 'service.version': '1.0.0', 'deployment.environment.name': 'production' }) },
    scopeSpans: [{
      scope: { name: 'issue-capture-test' },
      spans: [{
        traceId: PLAIN_TRACE_ID,
        spanId,
        name: 'POST /orders',
        kind: 2,
        startTimeUnixNano: String(Date.now() * 1e6),
        endTimeUnixNano: String((Date.now() + 5) * 1e6),
        attributes: kv({
          [ATTR_MULTIPLAYER_WORKSPACE_ID]: WORKSPACE_ID,
          [ATTR_MULTIPLAYER_PROJECT_ID]: PROJECT_ID,
          [ATTR_MULTIPLAYER_INTEGRATION_ID]: INTEGRATION_ID,
          'http.request.method': 'POST',
          'http.route': '/orders',
          'http.response.status_code': 500,
        }),
        status: { code: 2, message: 'order service unavailable' },
        events: [],
        links: [],
      }],
    }],
  }],
} as any)

const alertConditionTypes = () => (AlertService.sendAlert as jest.Mock).mock.calls.map(([, , payload]) => payload.conditionType)

beforeAll(async () => {
  await mongo.connect()
  await redis.connect()
})

beforeEach(() => {
  jest.spyOn(IssueSettingsLib, 'shouldCreateIssue').mockResolvedValue(true)
  jest.spyOn(IntegrationService, 'upsertOtelIntegrationStatus').mockResolvedValue(undefined as any)
  jest.spyOn(DebugSessionService, 'createDebugSessionSpans').mockResolvedValue(undefined as any)
  jest.spyOn(DebugSessionService, 'createDebugSessionForIssue').mockResolvedValue({
    debugSession: { _id: new ObjectId().toString(), shortId: 'issuecapture' } as any,
  })
  jest.spyOn(AlertService, 'sendAlert').mockResolvedValue(undefined as any)
  jest.spyOn(AgentService, 'shouldAutoResolveIssue').mockResolvedValue(false)
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  await Promise.all([
    IssueModel.deleteMany({ workspace: WORKSPACE_ID }),
    AlertRuleModel.deleteMany({ workspace: WORKSPACE_ID }),
    IssueEndUserModel.deleteMany({ workspace: WORKSPACE_ID }),
  ])
  await mongo.disconnect()
  await redis.disconnect()
})

describe('Issue capture', () => {
  let issue: IIssue

  it('turns an error outside any recorded session into an issue with an auto-created session', async () => {
    const { spanIssueMap } = await IssueService.handleIssueInTraceRequest(buildErrorTrace('0000000000000001'), false)

    issue = spanIssueMap['0000000000000001'] as IIssue
    expect(issue?.componentHash).toBeDefined()
    expect(DebugSessionService.createDebugSessionForIssue).toHaveBeenCalledTimes(1)
    expect(await IssueModel.findIssueByComponentHash(issue.componentHash as string)).toBeTruthy()
    expect(alertConditionTypes()).toEqual([undefined])
  })

  it('reopens a resolved issue when it occurs again and alerts it as unresolved', async () => {
    await IssueModel.updateIssueById(WORKSPACE_ID, PROJECT_ID, (issue as any)._id, { resolved: true } as any)
    // What resolving through the API/agent does: the next occurrence must not be throttled away
    await IssueService.resetOccurrenceThrottle(WORKSPACE_ID, PROJECT_ID, issue.componentHash as string)

    await IssueService.handleIssueInTraceRequest(buildErrorTrace('0000000000000002'), false)

    const reopened = await IssueModel.findIssueByComponentHash(issue.componentHash as string)
    expect(reopened?.resolved).toBe(false)
    expect(alertConditionTypes()).toEqual([undefined, AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED])
  })

  it('keeps an archived (ignored) issue archived and does not alert on it', async () => {
    await IssueModel.updateIssueById(WORKSPACE_ID, PROJECT_ID, (issue as any)._id, { resolved: true, archived: true } as any)
    await IssueService.resetOccurrenceThrottle(WORKSPACE_ID, PROJECT_ID, issue.componentHash as string)

    await IssueService.handleIssueInTraceRequest(buildErrorTrace('0000000000000003'), false)

    const stillIgnored = await IssueModel.findIssueByComponentHash(issue.componentHash as string)
    expect(stillIgnored?.archived).toBe(true)
    expect(stillIgnored?.resolved).toBe(true)
    expect(AlertService.sendAlert).not.toHaveBeenCalled()
  })
})

describe('Alert rule conditions', () => {
  const issue = {
    workspace: WORKSPACE_ID,
    project: PROJECT_ID,
    hash: 'alert-conditions-hash',
    componentHash: 'alert-conditions-component',
    title: 'Order service unavailable',
    service: { serviceName: 'checkout', serviceNameSlug: 'checkout', environment: 'production', environmentSlug: 'production' },
    createdAt: new Date(Date.now() - 60_000),
    updatedAt: new Date(),
  } as any as IIssue
  const span = { SpanAttributes: {}, ResourceAttributes: {} } as any

  const createRule = (name: string, type: AlertRuleConditionType, extra: Record<string, unknown> = {}) => AlertRuleModel.createAlertRule({
    workspace: WORKSPACE_ID,
    project: PROJECT_ID,
    name,
    enabled: true,
    conditionOperator: 'ANY',
    conditions: [{ type, ...extra }],
    filterOperator: 'ANY',
    filters: [],
    actions: [{ type: AlertRuleActionType.SEND_SLACK_NOTIFICATION }],
  } as any)

  const matching = async (payload: Parameters<typeof AlertService.checkAlertRules>[2]) => (
    await AlertService.checkAlertRules(WORKSPACE_ID, PROJECT_ID, payload)
  ).map(rule => rule.name).sort()

  beforeAll(async () => {
    await createRule('unarchived', AlertRuleConditionType.ISSUE_UNARCHIVED)
    await createRule('unresolved', AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED)
    await createRule('severity-raised', AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH)
    await createRule('users>=2', AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN, { value: '2', interval: '1h' })
    await createRule('users>=5', AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN, { value: '5', interval: '1h' })
    for (const hash of ['user-1', 'user-2', 'user-3']) {
      await IssueEndUserModel.createIssueEndUser({ workspace: WORKSPACE_ID, project: PROJECT_ID, issue, endUser: { hash } } as any)
    }
    await AlertRulesCache.del(PROJECT_ID)
  })

  it('fires state-change conditions only for their own state change', async () => {
    expect(await matching({ issue, conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED })).toEqual(['unarchived'])
    expect(await matching({ issue, conditionType: AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED })).toEqual(['unresolved'])
    expect(await matching({ issue, conditionType: AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH })).toEqual(['severity-raised'])
  })

  it('fires the affected-users threshold on occurrences, not on state changes', async () => {
    expect(await matching({ issue, span })).toEqual(['users>=2'])
    expect(await matching({ issue, conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED })).not.toContain('users>=2')
  })

  it('requires the issue, but no span, for state-change alerts', async () => {
    await expect(matching({ conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED })).rejects.toThrow('Issue is required')
  })
})
