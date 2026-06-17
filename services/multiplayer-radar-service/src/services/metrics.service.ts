import * as Clickhouse from '@multiplayer/clickhouse'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_ISSUE_HASH,
  ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH,
  ATTR_MULTIPLAYER_USER_HASH,
  ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH,
} from '@multiplayer-app/session-recorder-node'
import logger from '@multiplayer/logger'
import {
  type OtlpMetricsGauge,
  IIssue,
  MetricName,
  IssueGroupBy,
} from '@multiplayer/types'
import {
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_URL,
  SEMATTRS_HTTP_TARGET,
} from '@opentelemetry/semantic-conventions'
import {
  ATTR_MULTIPLAYER_ISSUE_TITLE_HASH,
  MetricsGranularity,
} from '../types'
import {
  CLICKHOUSE_OTEL_DB,
  CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME,
} from '../config'

const fieldMapping = {
  [IssueGroupBy.HASH]: `Attributes['${ATTR_MULTIPLAYER_ISSUE_HASH}']`,
  [IssueGroupBy.END_USER_HASH]: `Attributes['${ATTR_MULTIPLAYER_USER_HASH}']`,
  [IssueGroupBy.COMPONENT_HASH]: `Attributes['${ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH}']`,
  [IssueGroupBy.CUSTOM_HASH]: `Attributes['${ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH}']`,
  [IssueGroupBy.SESSION_ID]: `Attributes['${ATTR_MULTIPLAYER_SESSION_ID}']`,
  [IssueGroupBy.TITLE_HASH]: `Attributes['${ATTR_MULTIPLAYER_ISSUE_TITLE_HASH}']`,
}

interface MetricsFilter {
  metricName: MetricName,
  workspaceId: string,
  projectId: string,
  release?: string,
  environment?: string,

  issueHash?: { $in: string[] },
  issueComponentHash?: { $in: string[] },
  issueCustomHash?: { $in: string[] },
  issueTitleHash?: { $in: string[] },
  endUserHash?: { $in: string[] },
}

export const createMetrics = async (metrics: OtlpMetricsGauge[]): Promise<void> => {
  if (!metrics?.length) {
    return
  }

  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  await Clickhouse.insert(
    tableName,
    metrics,
    true,
  )

  logger.debug(`Inserted issue rate metrics ${metrics.length} to clickhouse db: ${tableName}`)
}

export const createIssueRateMetricData = (
  issue: IIssue,
  attributes?: {
    endUserHash?: string,
    debugSessionId?: string,
  },
) => {
  const now = new Date().toISOString()

  return {
    ServiceName: issue.service.serviceName,
    MetricName: MetricName.ISSUE_RATE,
    MetricUnit: '1',
    Attributes: {
      [ATTR_MULTIPLAYER_WORKSPACE_ID]: issue.workspace,
      [ATTR_MULTIPLAYER_PROJECT_ID]: issue.project,
      [ATTR_MULTIPLAYER_ISSUE_HASH]: issue.hash,
      [ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH]: issue.componentHash,
      [ATTR_MULTIPLAYER_ISSUE_TITLE_HASH]: issue.titleHash,
      ...(issue.customHash ? { [ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH]: issue.customHash } : {}),

      ...(attributes?.debugSessionId ? { [ATTR_MULTIPLAYER_SESSION_ID]: attributes.debugSessionId } : {}),

      ...(attributes?.endUserHash ? { [ATTR_MULTIPLAYER_USER_HASH]: attributes.endUserHash } : {}),
      ...(issue?.service?.release ? { [SEMRESATTRS_SERVICE_VERSION]: issue.service.release } : {}),
      ...(issue?.service?.environment ? { [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: issue.service.environment } : {}),
      ...(issue?.metadata?.httpTarget ? { [SEMATTRS_HTTP_TARGET]: issue.metadata.httpTarget } : {}),
      ...(issue?.metadata?.httpUrl ? { [SEMATTRS_HTTP_URL]: issue.metadata.httpUrl } : {}),
      ...(issue?.metadata?.httpRoute ? { [SEMATTRS_HTTP_ROUTE]: issue.metadata.httpRoute } : {}),
      ...(issue?.metadata?.httpMethod ? { [SEMATTRS_HTTP_METHOD]: issue.metadata.httpMethod } : {}),
    },
    StartTimeUnix: now,
    TimeUnix: now,
    Value: 1,
  }
}

export const createSessionRecordingWithErrorRateMetricData = (
  issue: IIssue,
  debugSessionId: string,
  endUserHash?: string,
) => {
  const now = new Date().toISOString()

  return {
    ServiceName: issue.service.serviceName,
    MetricName: MetricName.SESSION_RECORDING_WITH_ERROR_RATE,
    MetricUnit: '1',
    Attributes: {
      [ATTR_MULTIPLAYER_WORKSPACE_ID]: issue.workspace,
      [ATTR_MULTIPLAYER_PROJECT_ID]: issue.project,
      [ATTR_MULTIPLAYER_SESSION_ID]: debugSessionId,
      [ATTR_MULTIPLAYER_ISSUE_HASH]: issue.hash,
      [ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH]: issue.componentHash,
      [ATTR_MULTIPLAYER_ISSUE_TITLE_HASH]: issue.titleHash,

      ...(endUserHash ? { [ATTR_MULTIPLAYER_USER_HASH]: endUserHash } : {}),
      ...(issue.customHash ? { [ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH]: issue.customHash } : {}),

      ...(issue.service.release ? { [SEMRESATTRS_SERVICE_VERSION]: issue.service.release } : {}),
      ...(issue.service.environment ? { [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: issue.service.environment } : {}),
      ...(issue.metadata.httpTarget ? { [SEMATTRS_HTTP_TARGET]: issue.metadata.httpTarget } : {}),
      ...(issue.metadata.httpUrl ? { [SEMATTRS_HTTP_URL]: issue.metadata.httpUrl } : {}),
      ...(issue.metadata.httpRoute ? { [SEMATTRS_HTTP_ROUTE]: issue.metadata.httpRoute } : {}),
      ...(issue.metadata.httpMethod ? { [SEMATTRS_HTTP_METHOD]: issue.metadata.httpMethod } : {}),
    },
    StartTimeUnix: now,
    TimeUnix: now,
    Value: 1,
  }
}

export const createSessionRecordingRateMetricData = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  endUserHash: string,
) => {
  const nowIso = new Date().toISOString()

  return {
    MetricName: MetricName.SESSION_RECORDING_RATE,
    MetricUnit: '1',
    Attributes: {
      [ATTR_MULTIPLAYER_WORKSPACE_ID]: workspaceId,
      [ATTR_MULTIPLAYER_PROJECT_ID]: projectId,
      [ATTR_MULTIPLAYER_SESSION_ID]: debugSessionId,
      [ATTR_MULTIPLAYER_USER_HASH]: endUserHash,
    },
    StartTimeUnix: nowIso,
    TimeUnix: nowIso,
    Value: 1,
  }
}

const _getMetricsRaw = async (
  filter: MetricsFilter,
  fromTimestamp: Date,
  toTimestamp: Date,
  granularity: MetricsGranularity,
  groupBy?: IssueGroupBy,
  countDistinctBy?: IssueGroupBy,
): Promise<{ t: string, v: number }[]> => {
  if (groupBy && !fieldMapping[groupBy]) {
    throw new Error(`Invalid groupBy: ${groupBy}`)
  }

  if (
    countDistinctBy
    && !fieldMapping[countDistinctBy]
  ) {
    throw new Error(`Invalid countDistinctBy: ${countDistinctBy}`)
  }

  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  const conditions = {
    MetricName: filter.metricName,
    [`Attributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
    [`Attributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
    ...filter.release
      ? { [`Attributes['${SEMRESATTRS_SERVICE_VERSION}']`]: filter.release }
      : {},
    ...filter.environment
      ? { [`Attributes['${SEMRESATTRS_DEPLOYMENT_ENVIRONMENT}']`]: filter.environment }
      : {},
    ...filter.issueHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_HASH}']`]: filter.issueHash }
      : {},
    ...filter.issueComponentHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH}']`]: filter.issueComponentHash }
      : {},
    ...filter.issueCustomHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH}']`]: filter.issueCustomHash }
      : {},
    ...filter.endUserHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_USER_HASH}']`]: filter.endUserHash }
      : {},
    ...filter.issueTitleHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_TITLE_HASH}']`]: filter.issueTitleHash }
      : {},
    TimeUnix: {
      $lt: { $date: toTimestamp },
      $gt: { $date: fromTimestamp },
    },
  }

  const rows = await Clickhouse.select(
    tableName,
    conditions,
    undefined,
    `${groupBy ? `${fieldMapping[groupBy]} AS ${groupBy},` : ''}
    toStartOfInterval(TimeUnix, INTERVAL 1 ${granularity}) AS t,
    ${countDistinctBy ? `countDistinct(${fieldMapping[countDistinctBy]})` : 'sum(Value)'} AS v`,
    undefined,
    `GROUP BY ${groupBy ? `${groupBy},` : ''} t`,
    [
      ...(groupBy ? [{
        sortKey: groupBy,
        sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
      }] : []),
      {
        sortKey: 't',
        sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
      },
    ],
  )

  return rows
}

export const getMetricsByHash = async (
  filter: MetricsFilter,
  fromTimestamp: Date,
  toTimestamp: Date,
  granularity: MetricsGranularity,
  groupBy: IssueGroupBy,
): Promise<Record<string, { time: string, value: number }[]>> => {
  const rows = await _getMetricsRaw(
    filter,
    fromTimestamp,
    toTimestamp,
    granularity,
    groupBy,
  )

  const byHash: Record<string, { time: string, value: number }[]> = {}
  for (const row of rows) {
    const _key = row[groupBy] as string
    const list = byHash[_key] || []
    list.push({
      time: new Date(row.t.replace(' ', 'T') + 'Z').toISOString(),
      value: Number(row.v || 0),
    })
    byHash[_key] = list
  }

  return byHash
}

export const getMetrics = async (
  filter: MetricsFilter,
  fromTimestamp: Date,
  toTimestamp: Date,
  granularity: MetricsGranularity,
  groupBy?: IssueGroupBy,
  countDistinctBy?: IssueGroupBy,
): Promise<{ time: string, value: number }[]> => {
  const rows = await _getMetricsRaw(
    filter,
    fromTimestamp,
    toTimestamp,
    granularity,
    groupBy,
    countDistinctBy,
  )

  return rows.map(row => ({
    time: new Date(row.t.replace(' ', 'T') + 'Z').toISOString(),
    value: Number(row.v || 0),
  }))
}

export const removeMetricsByIssueHash = async (filter: {
  workspaceId: string,
  projectId: string,
  issueHash?: string | string[],
}) => {
  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  const conditions = {
    [`Attributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
    [`Attributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
  }

  if (filter.issueHash) {
    conditions[`Attributes['${ATTR_MULTIPLAYER_ISSUE_HASH}']`] = Array.isArray(filter.issueHash)
      ? {
        $in: filter.issueHash,
      }
      : filter.issueHash
  }

  await Clickhouse.remove(
    tableName,
    conditions,
  )
}

export const removeMetricsForSessionRecordings = async (filter: {
  workspaceId: string,
  projectId: string,
  sessionRecordingId?: string | string[],
}) => {
  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  const conditions = {
    [`Attributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
    [`Attributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
  }

  if (filter.sessionRecordingId) {
    conditions[`Attributes['${ATTR_MULTIPLAYER_SESSION_ID}']`] = Array.isArray(filter.sessionRecordingId)
      ? {
        $in: filter.sessionRecordingId,
      }
      : filter.sessionRecordingId
  } else {
    conditions[`Attributes['${ATTR_MULTIPLAYER_SESSION_ID}']`] = { $exists: true }
  }

  await Clickhouse.remove(
    tableName,
    conditions,
  )
}

export const removeMetricsForEndUsers = async (filter: {
  workspaceId: string,
  projectId: string,
  endUserHash?: string | string[],
}) => {
  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  const conditions = {
    [`Attributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
    [`Attributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
  }

  if (filter.endUserHash) {
    conditions[`Attributes['${ATTR_MULTIPLAYER_USER_HASH}']`] = Array.isArray(filter.endUserHash)
      ? {
        $in: filter.endUserHash,
      }
      : filter.endUserHash
  } else {
    conditions[`Attributes['${ATTR_MULTIPLAYER_USER_HASH}']`] = { $exists: true }
  }

  await Clickhouse.remove(
    tableName,
    conditions,
  )
}

export const getCount = async (
  filter: {
    metricName: MetricName,
    workspaceId: string,
    projectId: string,
    release?: string,
    environment?: string,

    hash?: { $in: string[] },
    componentHash?: { $in: string[] },
    customHash?: { $in: string[] },

    endUserHash?: { $in: string[] },
  },
  fromTimestamp: Date,
  toTimestamp: Date,
): Promise<number> => {
  const tableName = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME}`

  const conditions = {
    MetricName: filter.metricName,
    [`Attributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
    [`Attributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
    ...filter.release
      ? { [`Attributes['${SEMRESATTRS_SERVICE_VERSION}']`]: filter.release }
      : {},
    ...filter.environment
      ? { [`Attributes['${SEMRESATTRS_DEPLOYMENT_ENVIRONMENT}']`]: filter.environment }
      : {},
    ...filter.hash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_HASH}']`]: filter.hash }
      : {},
    ...filter.componentHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH}']`]: filter.componentHash }
      : {},
    ...filter.customHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH}']`]: filter.customHash }
      : {},
    ...filter.endUserHash
      ? { [`Attributes['${ATTR_MULTIPLAYER_USER_HASH}']`]: filter.endUserHash }
      : {},
    TimeUnix: {
      $lt: { $date: toTimestamp },
      $gt: { $date: fromTimestamp },
    },
  }

  const [row] = await Clickhouse.select(
    tableName,
    conditions,
    undefined,
    'count() AS v',
  )

  return Number(row.v || 0)
}

export const createMetricsFromIssues = async (
  issues: IIssue[],
  attributes?: {
    endUserHash?: string,
    debugSessionId?: string,
  },
): Promise<void> => {
  const gaugeMetrics: OtlpMetricsGauge[] = []

  gaugeMetrics.push(...issues
    .flatMap(issue => {
      const _metrics: OtlpMetricsGauge[] = []

      _metrics.push(createIssueRateMetricData(
        issue,
        attributes,
      ))

      if (attributes?.debugSessionId) {
        _metrics.push(createSessionRecordingWithErrorRateMetricData(
          issue,
          attributes.debugSessionId,
          attributes.endUserHash,
        ))
      }

      return _metrics
    }),
  )

  if (!gaugeMetrics.length) {
    return
  }

  await createMetrics(gaugeMetrics)
}

export const createIssueRateMetric = async (
  issue: IIssue,
  attributes?: {
    endUserHash?: string,
    debugSessionId?: string,
  },
) => {
  const gaugeMetrics: OtlpMetricsGauge[] = [
    createIssueRateMetricData(
      issue,
      attributes,
    ),
  ]

  await createMetrics(gaugeMetrics)
}

export const createSessionRecordingWithErrorRateMetric = async (
  issue: IIssue,
  debugSessionId: string,
  endUserHash?: string,
) => {
  const gaugeMetrics: OtlpMetricsGauge[] = [
    createSessionRecordingWithErrorRateMetricData(
      issue,
      debugSessionId,
      endUserHash,
    ),
  ]

  await createMetrics(gaugeMetrics)
}

export const createSessionRecordingRateMetric = async (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  endUserHash: string,
) => {
  const gaugeMetrics: OtlpMetricsGauge[] = [
    createSessionRecordingRateMetricData(
      workspaceId,
      projectId,
      debugSessionId,
      endUserHash,
    ),
  ]


  await createMetrics(gaugeMetrics)
}
