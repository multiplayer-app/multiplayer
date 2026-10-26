import mongo, { ObjectId } from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import {
  IssueModel,
  AlertRuleModel,
  AlertHistoryModel,
  ProjectModel,
  WorkspaceModel,
} from '@multiplayer/models'
import {
  AlertRuleConditionType,
  AlertRuleActionType,
  IssueCategoryEnum,
  type IIssue,
  type OtelSpanCh,
} from '@multiplayer/types'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
} from '@multiplayer-app/session-recorder-node'
import * as IssueService from '../src/services/issue.service'
import * as AlertService from '../src/services/alert.service'
import * as MetricsService from '../src/services/metrics.service'
import * as DebugSessionService from '../src/services/debug-session.service'
import * as IntegrationService from '../src/services/integration.service'
import * as ProjectService from '../src/services/project.service'
import * as AgentService from '../src/services/agent.service'
import * as IssueSettingsLib from '../src/libs/issue-settings.lib'
import { InternalNotificationService } from '../src/services/notification.internal.service'
import { OtlpLib } from '../src/libs'
import { AlertRulesCache } from '../src/cache'
import type { IExportTraceServiceRequest } from '../src/types'

// Error spans that used to be lost, misgrouped or left without alerts, and the hot-path guarantees.

const WORKSPACE_ID = new ObjectId().toString()
const PROJECT_ID = new ObjectId().toString()
const INTEGRATION_ID = new ObjectId().toString()

const kv = (attributes: Record<string, string | number>) => Object.entries(attributes)
  .map(([key, value]) => ({ key, value: typeof value === 'number' ? { intValue: value } : { stringValue: value } }))

let spanCounter = 0
const nextSpanId = () => (++spanCounter).toString(16).padStart(16, '0')

const errorSpan = (message: string, spanId = nextSpanId()) => ({
  traceId: 'b1b2c3d4e5f60718293a4b5c6d7e8f90',
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
  }),
  status: { code: 2, message },
  events: [{
    name: 'exception',
    timeUnixNano: String(Date.now() * 1e6),
    attributes: kv({ 'exception.type': 'Error', 'exception.message': message, 'exception.stacktrace': `Error: ${message}\n    at handler (/app/orders.ts:1:1)` }),
  }],
  links: [],
})

const trace = (...spans: ReturnType<typeof errorSpan>[]): IExportTraceServiceRequest => ({
  resourceSpans: [{
    resource: { attributes: kv({ 'service.name': 'checkout', 'deployment.environment.name': 'production' }) },
    scopeSpans: [{ scope: { name: 'error-tracking-test' }, spans }],
  }],
} as any)

const chSpan = (overrides: Partial<OtelSpanCh>): OtelSpanCh => ({
  TraceId: 'c1b2c3d4e5f60718293a4b5c6d7e8f90',
  SpanId: '0000000000000001',
  ServiceName: 'checkout',
  SpanKind: 4,
  StatusCode: 'ERROR',
  StatusMessage: 'consumer failed',
  SpanAttributes: { [ATTR_MULTIPLAYER_WORKSPACE_ID]: WORKSPACE_ID, [ATTR_MULTIPLAYER_PROJECT_ID]: PROJECT_ID },
  ResourceAttributes: {},
  Events: [],
  ...overrides,
} as any)

const occurrenceAlerts = () => (AlertService.sendAlert as jest.Mock).mock.calls
  .map(([, , payload]) => payload)
  .filter(payload => !payload.conditionType)

beforeAll(async () => {
  await mongo.connect()
  await redis.connect()
})

afterAll(async () => {
  await Promise.all([
    IssueModel.deleteMany({ workspace: WORKSPACE_ID }),
    AlertRuleModel.deleteMany({ workspace: WORKSPACE_ID }),
    AlertHistoryModel.deleteMany({ workspace: WORKSPACE_ID }),
  ])
  await mongo.disconnect()
  await redis.disconnect()
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('Issue creation settings', () => {
  const issue = { project: PROJECT_ID, category: IssueCategoryEnum.HTTP_CLIENT } as any as IIssue

  const withCategories = (createOnlyForCategories: IssueCategoryEnum[]) => {
    jest.spyOn(IntegrationService, 'getIntegrationById').mockResolvedValue({ otel: { autoCreateIssues: true } } as any)
    jest.spyOn(ProjectService, 'getProject').mockResolvedValue({ settings: { issue: { createOnlyForCategories } } } as any)
  }

  it('creates issues of every category when no category is selected', async () => {
    withCategories([])
    expect(await IssueSettingsLib.shouldCreateIssue(issue, INTEGRATION_ID)).toBe(true)
  })

  it('limits issues to the selected categories', async () => {
    withCategories([IssueCategoryEnum.EXCEPTION])
    expect(await IssueSettingsLib.shouldCreateIssue(issue, INTEGRATION_ID)).toBe(false)
  })
})

describe('Issue extraction from spans', () => {
  it('reads the exception from the exception event, not the first event', () => {
    const issue = OtlpLib.getIssueFromSpan(chSpan({
      Events: [
        { Name: 'fetchStart', Timestamp: '0', Attributes: {} },
        { Name: 'exception', Timestamp: '1', Attributes: { 'exception.type': 'TypeError', 'exception.message': 'cart is undefined', 'exception.stacktrace': 'TypeError: cart is undefined\n    at checkout (app.js:1:1)' } },
      ] as any,
    }))

    expect(issue?.category).toBe(IssueCategoryEnum.EXCEPTION)
    expect(issue?.metadata?.type).toBe('TypeError')
  })

  it('titles a messaging error by the error, not by the message id', () => {
    const issue = OtlpLib.getIssueFromSpan(chSpan({
      SpanAttributes: {
        [ATTR_MULTIPLAYER_WORKSPACE_ID]: WORKSPACE_ID,
        [ATTR_MULTIPLAYER_PROJECT_ID]: PROJECT_ID,
        'messaging.message.id': 'a9b8c7d6e5f4',
      },
      Events: [{ Name: 'exception', Timestamp: '1', Attributes: { 'exception.type': 'Error', 'exception.message': 'order payload invalid' } }] as any,
    }))

    expect(issue?.metadata?.message).toBe('order payload invalid')
  })

  it('accepts exceptions recorded as attributes without an error status, as the collector does', () => {
    expect(OtlpLib.isErrorSpan(chSpan({
      StatusCode: 'UNSET',
      SpanAttributes: { 'exception.type': 'Error', 'exception.message': 'boom' },
    }))).toBe(true)
    expect(OtlpLib.isErrorSpan(chSpan({ StatusCode: 'UNSET', SpanAttributes: {} }))).toBe(false)
  })
})

describe('Error span processing', () => {
  beforeEach(() => {
    jest.spyOn(IssueSettingsLib, 'shouldCreateIssue').mockResolvedValue(true)
    jest.spyOn(IntegrationService, 'upsertOtelIntegrationStatus').mockResolvedValue(undefined as any)
    jest.spyOn(DebugSessionService, 'createDebugSessionSpans').mockResolvedValue(undefined as any)
    jest.spyOn(DebugSessionService, 'createDebugSessionForIssue').mockImplementation(async () => ({
      debugSession: { _id: new ObjectId().toString(), shortId: 'errortrack' } as any,
    }))
    jest.spyOn(AlertService, 'sendAlert').mockResolvedValue(undefined as any)
    jest.spyOn(AgentService, 'shouldAutoResolveIssue').mockResolvedValue(false)
  })

  it('keeps the issue fresh and evaluates alerts on throttled occurrences, once per minute', async () => {
    await IssueService.handleIssueInTraceRequest(trace(errorSpan('inventory service timeout')), true)
    const issue = await IssueModel.findOne({ workspace: WORKSPACE_ID, title: 'inventory service timeout' })
    await IssueModel.updateOne({ _id: issue?._id }, { $set: { lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000) } })
    ;(AlertService.sendAlert as jest.Mock).mockClear()

    await IssueService.handleIssueInTraceRequest(trace(errorSpan('inventory service timeout')), true)
    await IssueService.handleIssueInTraceRequest(trace(errorSpan('inventory service timeout')), true)

    const refreshed = await IssueModel.findById(issue?._id)
    expect(Date.now() - (refreshed?.lastSeen as Date).getTime()).toBeLessThan(60_000)
    expect(occurrenceAlerts()).toHaveLength(1)
    expect(String(occurrenceAlerts()[0].issue._id)).toBe(String(issue?._id))
  })

  it('catches a regression even when resolving did not reset the throttle', async () => {
    await IssueService.handleIssueInTraceRequest(trace(errorSpan('payment gateway refused')), true)
    // Resolved behind the pipeline's back: the throttle is still set
    await IssueModel.updateOne({ workspace: WORKSPACE_ID, title: 'payment gateway refused' }, { $set: { resolved: true } })
    ;(AlertService.sendAlert as jest.Mock).mockClear()

    await IssueService.handleIssueInTraceRequest(trace(errorSpan('payment gateway refused')), true)

    const reopened = await IssueModel.findOne({ workspace: WORKSPACE_ID, title: 'payment gateway refused' })
    expect(reopened?.resolved).toBe(false)
    expect((AlertService.sendAlert as jest.Mock).mock.calls.map(([, , payload]) => payload.conditionType))
      .toContain(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED)
  })

  it('still tracks the other errors of a trace when one of them fails', async () => {
    const createIssue = jest.spyOn(IssueModel, 'createIssue')
    createIssue.mockRejectedValueOnce(new Error('connection reset'))

    const { spanIssueMap } = await IssueService.handleIssueInTraceRequest(
      trace(errorSpan('shipping label failed'), errorSpan('tax calculation failed')),
      true,
    )

    expect(Object.values(spanIssueMap).map(issue => issue.title)).toEqual(['tax calculation failed'])
  })

  it('processes a span delivered twice at the same time only once', async () => {
    const createIssue = jest.spyOn(IssueModel, 'createIssue')
    const span = errorSpan('duplicate delivery')

    await Promise.all([
      IssueService.handleIssueInTraceRequest(trace(span), true),
      IssueService.handleIssueInTraceRequest(trace(span), true),
    ])

    expect(createIssue).toHaveBeenCalledTimes(1)
  })
})

describe('Threshold alerts', () => {
  const issue = {
    _id: new ObjectId().toString(),
    workspace: WORKSPACE_ID,
    project: PROJECT_ID,
    hash: 'threshold-hash',
    componentHash: `threshold-component-${Date.now()}`,
    title: 'Order service unavailable',
    service: { serviceName: 'checkout', serviceNameSlug: 'checkout', environment: 'production', environmentSlug: 'production' },
    createdAt: new Date(Date.now() - 60_000),
    updatedAt: new Date(),
  } as any as IIssue
  const span = { SpanAttributes: {}, ResourceAttributes: {} } as any

  beforeAll(async () => {
    await AlertRuleModel.createAlertRule({
      workspace: WORKSPACE_ID,
      project: PROJECT_ID,
      name: 'any-occurrence',
      enabled: true,
      conditionOperator: 'ANY',
      conditions: [{ type: AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN, value: '0', interval: '1h' }],
      filterOperator: 'ANY',
      filters: [],
      actions: [{ type: AlertRuleActionType.SEND_SLACK_NOTIFICATION, integration: INTEGRATION_ID, slack: { workspace: 'acme' } }],
    } as any)
    await AlertRuleModel.createAlertRule({
      workspace: WORKSPACE_ID,
      project: PROJECT_ID,
      name: 'other-component',
      enabled: true,
      scope: { componentName: 'billing' },
      conditionOperator: 'ANY',
      conditions: [{ type: AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN, value: '0', interval: '1h' }],
      filterOperator: 'ANY',
      filters: [],
      actions: [{ type: AlertRuleActionType.SEND_SLACK_NOTIFICATION, integration: INTEGRATION_ID, slack: { workspace: 'acme' } }],
    } as any)
    await AlertRulesCache.del(PROJECT_ID)
  })

  beforeEach(() => {
    jest.spyOn(ProjectModel, 'findProjectById').mockResolvedValue({ toObject: () => ({ _id: PROJECT_ID, name: 'Shop' }) } as any)
    jest.spyOn(WorkspaceModel, 'findWorkspaceById').mockResolvedValue({ toObject: () => ({ _id: WORKSPACE_ID, name: 'Acme' }) } as any)
    jest.spyOn(InternalNotificationService.prototype, 'sendNotification').mockResolvedValue(undefined)
  })

  it('alerts a crossed threshold once per interval, not on every occurrence', async () => {
    await AlertService.sendAlert(WORKSPACE_ID, PROJECT_ID, { issue, span })
    await AlertService.sendAlert(WORKSPACE_ID, PROJECT_ID, { issue, span })

    expect(InternalNotificationService.prototype.sendNotification).toHaveBeenCalledTimes(1)
  })

  it('counts occurrences only for the rules in scope, and none for state changes', async () => {
    const getCount = jest.spyOn(MetricsService, 'getCount')

    await AlertService.checkAlertRules(WORKSPACE_ID, PROJECT_ID, { issue, span })
    expect(getCount).toHaveBeenCalledTimes(1)

    getCount.mockClear()
    await AlertService.checkAlertRules(WORKSPACE_ID, PROJECT_ID, { issue, conditionType: AlertRuleConditionType.ISSUE_UNARCHIVED })
    expect(getCount).not.toHaveBeenCalled()
  })
})
