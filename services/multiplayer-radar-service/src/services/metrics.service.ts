import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_ISSUE_HASH,
  ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH,
  ATTR_MULTIPLAYER_USER_HASH,
  ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH,
} from '@multiplayer-app/session-recorder-node'
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
import type { PipelineStage } from 'mongoose'
import { MetricsGaugeModel } from '@multiplayer/models'
import {
  ATTR_MULTIPLAYER_ISSUE_TITLE_HASH,
  MetricsGranularity,
} from '../types'
import { buildMetricsFilter, extractAttributeKey } from '../util/metrics-filter.util'

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
  await MetricsGaugeModel.insertGauges(metrics)
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

// Builds a time-bucketed aggregation pipeline: $match -> optional dimension
// extraction(s) out of the Attributes array (for groupBy/countDistinctBy) -> $group
// by {t, dim} summing Value, or - when countDistinctBy is set - a two-stage group
// (dedupe by {t, dim, cd}, then count how many distinct cd values landed per {t, dim})
// since Mongo has no single-stage countDistinct-per-bucket operator.
const buildTimeBucketPipeline = (
  matchFilter: Record<string, unknown>,
  granularity: MetricsGranularity,
  groupByField?: string,
  groupByAlias?: string,
  countDistinctField?: string,
): Record<string, unknown>[] => {
  const pipeline: Record<string, unknown>[] = [{ $match: matchFilter }]

  const addDimensionField = (fieldExpression: string, outputField: string) => {
    const key = extractAttributeKey(fieldExpression)

    pipeline.push({
      $addFields: {
        [outputField]: {
          $let: {
            vars: {
              matchedAttribute: {
                $arrayElemAt: [
                  { $filter: { input: '$Attributes', cond: { $eq: ['$$this.key', key] } } },
                  0,
                ],
              },
            },
            in: '$$matchedAttribute.value',
          },
        },
      },
    })
  }

  if (groupByField) {
    addDimensionField(groupByField, '__dim')
  }
  if (countDistinctField) {
    addDimensionField(countDistinctField, '__countDistinctDim')
  }

  const bucketId: Record<string, unknown> = {
    t: { $dateTrunc: { date: '$TimeUnix', unit: granularity, binSize: 1 } },
    ...(groupByField ? { dim: '$__dim' } : {}),
  }

  if (countDistinctField) {
    pipeline.push(
      { $group: { _id: { ...bucketId, cd: '$__countDistinctDim' } } },
      {
        $group: {
          _id: { t: '$_id.t', ...(groupByField ? { dim: '$_id.dim' } : {}) },
          v: { $sum: 1 },
        },
      },
    )
  } else {
    pipeline.push({ $group: { _id: bucketId, v: { $sum: '$Value' } } })
  }

  pipeline.push(
    {
      $project: {
        _id: 0,
        t: '$_id.t',
        v: 1,
        ...(groupByAlias ? { [groupByAlias]: '$_id.dim' } : {}),
      },
    },
    { $sort: { ...(groupByAlias ? { [groupByAlias]: 1 } : {}), t: 1 } },
  )

  return pipeline
}

const _getMetricsRaw = async (
  filter: MetricsFilter,
  fromTimestamp: Date,
  toTimestamp: Date,
  granularity: MetricsGranularity,
  groupBy?: IssueGroupBy,
  countDistinctBy?: IssueGroupBy,
): Promise<{ t: Date, v: number }[]> => {
  if (groupBy && !fieldMapping[groupBy]) {
    throw new Error(`Invalid groupBy: ${groupBy}`)
  }

  if (
    countDistinctBy
    && !fieldMapping[countDistinctBy]
  ) {
    throw new Error(`Invalid countDistinctBy: ${countDistinctBy}`)
  }

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

  const pipeline = buildTimeBucketPipeline(
    buildMetricsFilter(conditions),
    granularity,
    groupBy ? fieldMapping[groupBy] : undefined,
    groupBy,
    countDistinctBy ? fieldMapping[countDistinctBy] : undefined,
  )

  const rows = await MetricsGaugeModel.aggregate(pipeline as unknown as PipelineStage[])

  return rows as { t: Date, v: number }[]
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
    const _key = row[groupBy] as unknown as string
    const list = byHash[_key] || []
    list.push({
      time: row.t.toISOString(),
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
    time: row.t.toISOString(),
    value: Number(row.v || 0),
  }))
}

export const removeMetricsByIssueHash = async (filter: {
  workspaceId: string,
  projectId: string,
  issueHash?: string | string[],
}) => {
  const conditions: Record<string, unknown> = {
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

  await MetricsGaugeModel.deleteMany(buildMetricsFilter(conditions))
}

export const removeMetricsForSessionRecordings = async (filter: {
  workspaceId: string,
  projectId: string,
  sessionRecordingId?: string | string[],
}) => {
  const conditions: Record<string, unknown> = {
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

  await MetricsGaugeModel.deleteMany(buildMetricsFilter(conditions))
}

export const removeMetricsForEndUsers = async (filter: {
  workspaceId: string,
  projectId: string,
  endUserHash?: string | string[],
}) => {
  const conditions: Record<string, unknown> = {
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

  await MetricsGaugeModel.deleteMany(buildMetricsFilter(conditions))
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

  return MetricsGaugeModel.countDocuments(buildMetricsFilter(conditions))
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
