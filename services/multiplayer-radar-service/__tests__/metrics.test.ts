import mongo from '@multiplayer/mongo'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_ISSUE_HASH,
  ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH,
  ATTR_MULTIPLAYER_USER_HASH,
} from '@multiplayer-app/session-recorder-node'
import { MetricsGaugeModel } from '@multiplayer/models'
import { MetricName, IssueGroupBy, MetricsGranularity, type OtlpMetricsGauge } from '@multiplayer/types'
import * as MetricsService from '../src/services/metrics.service'
import { buildMetricsFilter } from '../src/util/metrics-filter.util'

const WORKSPACE_ID = 'w-metrics-1'
const PROJECT_ID = 'p-metrics-1'

const gauge = (overrides: Partial<OtlpMetricsGauge> & { Attributes: Record<string, string> }): OtlpMetricsGauge => ({
  MetricName: MetricName.ISSUE_RATE,
  MetricUnit: '1',
  Value: 1,
  StartTimeUnix: new Date().toISOString(),
  TimeUnix: new Date().toISOString(),
  ...overrides,
  Attributes: {
    [ATTR_MULTIPLAYER_WORKSPACE_ID]: WORKSPACE_ID,
    [ATTR_MULTIPLAYER_PROJECT_ID]: PROJECT_ID,
    ...overrides.Attributes,
  },
})

beforeAll(async () => {
  await mongo.connect()
})

afterAll(async () => {
  await MetricsGaugeModel.deleteMany({
    Attributes: { $elemMatch: { key: ATTR_MULTIPLAYER_WORKSPACE_ID, value: WORKSPACE_ID } },
  })
  await mongo.disconnect()
})

describe('createMetrics / getCount', () => {
  it('counts only rows matching the given issue hash', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-1' }, TimeUnix: '2024-01-01T10:00:00.000Z' }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-1' }, TimeUnix: '2024-01-01T10:30:00.000Z' }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-2' }, TimeUnix: '2024-01-01T10:00:00.000Z' }),
    ])

    const count = await MetricsService.getCount(
      {
        metricName: MetricName.ISSUE_RATE,
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        hash: { $in: ['hash-1'] },
      },
      new Date('2024-01-01T00:00:00.000Z'),
      new Date('2024-01-02T00:00:00.000Z'),
    )

    expect(count).toBe(2)
  })
})

describe('workspaceId/projectId index usage', () => {
  it('getCount/getMetrics-shaped queries use the workspaceId_1_projectId_1 index, not a collection scan', async () => {
    const filter = buildMetricsFilter({
      MetricName: MetricName.ISSUE_RATE,
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      TimeUnix: { $gt: { $date: new Date(0) }, $lt: { $date: new Date() } },
    })

    const plan = await MetricsGaugeModel.find(filter).explain('executionStats')
    const serializedPlan = JSON.stringify(plan.queryPlanner.winningPlan)

    expect(serializedPlan).toContain('workspaceId_1_projectId_1')
    expect(serializedPlan).not.toContain('COLLSCAN')
  })

  it('remove*-shaped queries (workspaceId/projectId plus an Attributes condition) never fall back to a collection scan', async () => {
    const filter = {
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      Attributes: { $all: [{ $elemMatch: { key: ATTR_MULTIPLAYER_SESSION_ID } }] },
    }

    const plan = await MetricsGaugeModel.find(filter).explain('executionStats')
    const serializedPlan = JSON.stringify(plan.queryPlanner.winningPlan)

    expect(serializedPlan).not.toContain('COLLSCAN')
  })
})

describe('getMetrics: time-bucketed sum', () => {
  it('buckets by hour and sums Value within each bucket', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-bucket' }, Value: 3, TimeUnix: '2024-02-01T10:15:00.000Z' }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-bucket' }, Value: 4, TimeUnix: '2024-02-01T10:45:00.000Z' }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-bucket' }, Value: 5, TimeUnix: '2024-02-01T11:05:00.000Z' }),
    ])

    const rows = await MetricsService.getMetrics(
      {
        metricName: MetricName.ISSUE_RATE,
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        issueHash: { $in: ['hash-bucket'] },
      },
      new Date('2024-02-01T00:00:00.000Z'),
      new Date('2024-02-02T00:00:00.000Z'),
      MetricsGranularity.HOUR,
    )

    expect(rows).toEqual([
      { time: new Date('2024-02-01T10:00:00.000Z').toISOString(), value: 7 },
      { time: new Date('2024-02-01T11:00:00.000Z').toISOString(), value: 5 },
    ])
  })
})

describe('getMetricsByHash: grouped time-bucketed sum', () => {
  it('returns a separate bucketed series per componentHash', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH]: 'comp-a' }, Value: 2, TimeUnix: '2024-03-01T10:00:00.000Z' }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH]: 'comp-b' }, Value: 9, TimeUnix: '2024-03-01T10:00:00.000Z' }),
    ])

    const byHash = await MetricsService.getMetricsByHash(
      {
        metricName: MetricName.ISSUE_RATE,
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
      },
      new Date('2024-03-01T00:00:00.000Z'),
      new Date('2024-03-02T00:00:00.000Z'),
      MetricsGranularity.HOUR,
      IssueGroupBy.COMPONENT_HASH,
    )

    expect(byHash['comp-a']).toEqual([{ time: new Date('2024-03-01T10:00:00.000Z').toISOString(), value: 2 }])
    expect(byHash['comp-b']).toEqual([{ time: new Date('2024-03-01T10:00:00.000Z').toISOString(), value: 9 }])
  })
})

describe('getMetrics: countDistinctBy', () => {
  it('counts distinct session ids per time bucket rather than summing Value', async () => {
    await MetricsService.createMetrics([
      gauge({
        MetricName: MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
        Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-cd', [ATTR_MULTIPLAYER_SESSION_ID]: 'session-1' },
        TimeUnix: '2024-04-01T10:00:00.000Z',
      }),
      // Same session id reported twice within the same bucket - should count once.
      gauge({
        MetricName: MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
        Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-cd', [ATTR_MULTIPLAYER_SESSION_ID]: 'session-1' },
        TimeUnix: '2024-04-01T10:10:00.000Z',
      }),
      gauge({
        MetricName: MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
        Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-cd', [ATTR_MULTIPLAYER_SESSION_ID]: 'session-2' },
        TimeUnix: '2024-04-01T10:20:00.000Z',
      }),
    ])

    const rows = await MetricsService.getMetrics(
      {
        metricName: MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        issueHash: { $in: ['hash-cd'] },
      },
      new Date('2024-04-01T00:00:00.000Z'),
      new Date('2024-04-02T00:00:00.000Z'),
      MetricsGranularity.HOUR,
      undefined,
      IssueGroupBy.SESSION_ID,
    )

    expect(rows).toEqual([{ time: new Date('2024-04-01T10:00:00.000Z').toISOString(), value: 2 }])
  })
})

describe('removeMetricsByIssueHash / removeMetricsForSessionRecordings / removeMetricsForEndUsers', () => {
  it('removeMetricsByIssueHash only removes rows matching the given hash', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-remove-1' } }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-remove-2' } }),
    ])

    await MetricsService.removeMetricsByIssueHash({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      issueHash: 'hash-remove-1',
    })

    const remaining = await MetricsService.getCount(
      { metricName: MetricName.ISSUE_RATE, workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, hash: { $in: ['hash-remove-1', 'hash-remove-2'] } },
      new Date('2000-01-01T00:00:00.000Z'),
      new Date('2100-01-01T00:00:00.000Z'),
    )

    expect(remaining).toBe(1)
  })

  it('removeMetricsForSessionRecordings with no filter only removes rows that have a session id attribute', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_SESSION_ID]: 'session-fallback' } }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_ISSUE_HASH]: 'hash-no-session' } }),
    ])

    await MetricsService.removeMetricsForSessionRecordings({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
    })

    const withSessionId = await MetricsGaugeModel.countDocuments({
      Attributes: {
        $all: [
          { $elemMatch: { key: ATTR_MULTIPLAYER_WORKSPACE_ID, value: WORKSPACE_ID } },
          { $elemMatch: { key: ATTR_MULTIPLAYER_SESSION_ID } },
        ],
      },
    })
    const withoutSessionId = await MetricsGaugeModel.countDocuments({
      Attributes: {
        $all: [
          { $elemMatch: { key: ATTR_MULTIPLAYER_WORKSPACE_ID, value: WORKSPACE_ID } },
          { $elemMatch: { key: ATTR_MULTIPLAYER_ISSUE_HASH, value: 'hash-no-session' } },
        ],
      },
    })

    expect(withSessionId).toBe(0)
    expect(withoutSessionId).toBe(1)
  })

  it('removeMetricsForEndUsers removes only rows matching the given end user hash', async () => {
    await MetricsService.createMetrics([
      gauge({ Attributes: { [ATTR_MULTIPLAYER_USER_HASH]: 'user-1' } }),
      gauge({ Attributes: { [ATTR_MULTIPLAYER_USER_HASH]: 'user-2' } }),
    ])

    await MetricsService.removeMetricsForEndUsers({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      endUserHash: 'user-1',
    })

    const remainingUser1 = await MetricsGaugeModel.countDocuments({
      Attributes: { $elemMatch: { key: ATTR_MULTIPLAYER_USER_HASH, value: 'user-1' } },
    })
    const remainingUser2 = await MetricsGaugeModel.countDocuments({
      Attributes: { $elemMatch: { key: ATTR_MULTIPLAYER_USER_HASH, value: 'user-2' } },
    })

    expect(remainingUser1).toBe(0)
    expect(remainingUser2).toBe(1)
  })
})
