import { metrics } from '@multiplayer/apm'
import * as Clickhouse from '@multiplayer/clickhouse'
import logger from '@multiplayer/logger'
import {
  slugifyString,
  removeDuplicatesByKey,
} from '@multiplayer/util-shared'
import { Timer } from '@multiplayer/util'
import {
  ATTR_MULTIPLAYER_INTEGRATION_ID,
} from '@multiplayer-app/session-recorder-node'
import { Readable } from 'stream'
import {
  type IRadarDetection,
  RadarDetectionType,
  RadarDetectionSource,
  type IRadarDetectionParam,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
  HttpMethod,
  FeatureFlag,
} from '@multiplayer/types'
import {
  CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME,
  CLICKHOUSE_RADAR_DB,
  CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME,
} from '../config'
import { RadarDetectionQueryBuilder } from '../helpers'
import {
  RadarDetectionQueryFilter,
  RadarDetectionDeleteFilter,
  type IExportTraceServiceRequest,
} from '../types'
import {
  ActiveAutoMergeCache,
  DetectionCache,
} from '../cache'
import {
  OtlpLib,
} from '../libs'
import {
  WorkspaceService,
  IntegrationService,
  FlowService,
  ReleaseService,
} from '../services'
import {
  OtelSpanParser,
} from '../util'

const totalDocumentationSpansCounter = metrics.createCounter('processed_documentation_spans_total')
const processingDocumentationSpansErrorRate = metrics.createCounter('processing_documentation_spans_error_rate')
const processingDocumentationSpansDuration = metrics.createHistogram(
  'processing_documentation_spans_duration',
  {
    unit: 'ms',
  },
)

export const createDetections = async (radarDetections: IRadarDetection[]) => {
  const table = `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`
  await Clickhouse.insert(
    table,
    radarDetections.map((detection) => {
      const slugifiedDetection = { ...detection }
      if (slugifiedDetection.componentName)
        slugifiedDetection.componentName = slugifyString(slugifiedDetection.componentName)
      if (slugifiedDetection.environmentName)
        slugifiedDetection.environmentName = slugifyString(slugifiedDetection.environmentName)
      if (slugifiedDetection.environmentNames)
        slugifiedDetection.environmentNames = slugifiedDetection.environmentNames.map((name) => slugifyString(name))
      return slugifiedDetection
    }),
    true,
  )

  logger.debug(`Inserted ${radarDetections.length} radar detections to clickhouse (${table})`)
}

export const deleteDetections = async (filter: RadarDetectionDeleteFilter) => {
  await Clickhouse.remove(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`,
    filter,
  )

  logger.debug({ filter }, 'Deleted detections from clickhouse')
}

export const listDetections = async (
  filter: {
    workspaceId: string,
    projectId: string,
    type?: RadarDetectionType | RadarDetectionType[],
    Sign?: RadarDetectionSource,
    componentName?: string[] | string | { $like: string },
    environmentName?: string[]
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
  cursor?: {
    skip: number,
    limit: number,
  },
): Promise<IRadarDetection[]> => {
  const detections = await Clickhouse.select(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`,
    filter,
    cursor,
  )

  return detections as IRadarDetection[]
}

export const getTotalDetectionsCount = async (filter: {
  workspaceId: string,
  projectId: string,
  type?: RadarDetectionType[],
  componentName?: string[] | string | { $like: string },
  environmentName?: string[]
  Timestamp?: {
    $lt?: { $date: Date },
    $gt?: { $date: Date }
  }
}): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`,
    filter,
  )
}

export const getNotAppliedDetections = async (
  filter: RadarDetectionQueryFilter,
  cursor?: {
    skip: number,
    limit: number,
  },
  returnStream?: boolean,
) => {
  const query = RadarDetectionQueryBuilder.getRadarDetectionsQuery({
    ...filter,
    Sign: RadarDetectionSource.RADAR,
  }, cursor)

  const detections = await Clickhouse.rawSelect(query, returnStream)

  return detections
}

export const listRadarDetectionsWithSign = async (
  filter: RadarDetectionQueryFilter,
  cursor?: {
    skip: number,
    limit: number,
  },
  sort?: Clickhouse.ClickHouseTypes.ISortOptions | Clickhouse.ClickHouseTypes.ISortOptions[],
  stream = true,
): Promise<any> => {
  const query = RadarDetectionQueryBuilder.getRadarDetectionsQuery(
    filter,
    cursor,
    sort,
  )
  const detectionsStream = await Clickhouse.rawSelect(query, stream)

  return detectionsStream
}

export const getRadarDetectionsWithSignCount = async (filter: RadarDetectionQueryFilter) => {
  const query = `SELECT count()
    FROM (${RadarDetectionQueryBuilder.getRadarDetectionsQuery(filter)})`

  const rows = await Clickhouse.rawSelect(query)

  return Number((rows as any[])[0]['count()'] || 0)
}

export const getRadarDetectedEnvironmentNames = async (
  filter: {
    workspaceId: string,
    projectId: string,
  },
): Promise<{ environmentName: string }[]> => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter({
    ...filter,
    type: RadarDetectionType.ENVIRONMENT,
    Sign: -1,
  })

  const query = `
    SELECT
      DISTINCT ON (environmentName) environmentName
    FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}
    WHERE ${_filter}
  `

  const rows = await Clickhouse.rawSelect(query)

  return rows
}

export const getDetectedComponents = async (
  filter: {
    workspaceId: string,
    projectId: string,
  },
): Promise<{ componentName: string }[]> => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter({
    ...filter,
    type: [RadarDetectionType.DEPENDENCY, RadarDetectionType.SERVICE],
    component_name: { $not: '' },
  })

  const query = `
    SELECT DISTINCT component_name
    FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}
    ARRAY JOIN [componentName, sourceComponentName, targetComponentName] AS component_name
    WHERE ${_filter}
  `

  const rows = await Clickhouse.rawSelect(query)

  return rows.map(({ component_name }) => ({ componentName: component_name }))
}

export const listRadarDetectedDependencies = async (
  filter: RadarDetectionQueryFilter,
  cursor?: {
    skip: number,
    limit: number,
  },
  sort?: Clickhouse.ClickHouseTypes.ISortOptions | Clickhouse.ClickHouseTypes.ISortOptions[],
  stream = true,
): Promise<Readable> => {
  const query = RadarDetectionQueryBuilder.getRadarDependencyDetectionsQuery(
    filter,
    cursor,
    sort,
  )
  const dependencyDetectionsStream = await Clickhouse.rawSelect(query, stream)

  return dependencyDetectionsStream
}

export const getRadarDetectedDependenciesCount = async (filter: RadarDetectionQueryFilter) => {
  const query = `SELECT count()
  FROM (${RadarDetectionQueryBuilder.getRadarDependencyDetectionsQuery(filter)})`

  const rows = await Clickhouse.rawSelect(query)

  return Number((rows as any[])[0]['count()'] || 0)
}

export const getRadarDetectionsWithoutDuplicates = async (
  filter: RadarDetectionQueryFilter,
): Promise<IRadarDetection[]> => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter(filter)

  const query = `
    SELECT DISTINCT ON (collapse_id) *
    FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}
    WHERE ${_filter}
  `

  const rows = await Clickhouse.rawSelect(query)

  return rows
}

export const getDetectionById = async (
  id: string,
): Promise<IRadarDetection | undefined> => {
  const [detection] = await Clickhouse.select(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`,
    { id },
    {
      skip: 0,
      limit: 1,
    },
    undefined,
    undefined,
    undefined,
    {
      sortKey: 'componentAliasName',
      sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.DESC,
    },
  )

  return detection as IRadarDetection
}


export const createRadarDetectionHttpParams = async (radarDetectionHttpParams: IRadarDetectionParam[]) => {
  const table = `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}`
  await Clickhouse.insert(
    table,
    radarDetectionHttpParams,
    true,
  )

  logger.debug(`Inserted ${radarDetectionHttpParams.length} radar detection params to clickhouse (${table})`)
}

export const listRadarDetectionParams = async (
  filter: {
    workspaceId: string,
    projectId: string,
    type?: RadarDetectionType[],
    componentName?: string[] | string | { $like: string },
    environmentName?: string[]
    release?: { $like: string[] },
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
  cursor: {
    skip: number,
    limit: number,
  },
): Promise<IRadarDetectionParam[]> => {
  const radarDetectionHttpParams = await Clickhouse.select(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}`,
    filter as any,
    cursor,
  )

  return radarDetectionHttpParams as IRadarDetectionParam[]
}

export const getNotAppliedParamDetections = async (
  filter: {
    workspaceId: string,
    projectId: string,
    integrationId?: string,
    endpointId?: string,
    componentName?: string[] | string | { $like: string } | { $not: null },
    environmentName?: string[]
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
  cursor?: {
    skip: number,
    limit: number,
  },
  returnStream?: boolean,
) => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter(filter)
  const fields = [
    'id',
    'last_value(endpointId) as endpointId',
    'last_value(workspaceId) as workspaceId',
    'last_value(projectId) as projectId',
    'last_value(integrationId) as integrationId',
    'last_value(environmentId) as environmentId',
    'last_value(environmentName) as environmentName',
    'last_value(entityId) as entityId',
    'last_value(componentName) as componentName',
    'last_value(endpointType) as endpointType',
    'last_value(httpMethod) as httpMethod',
    'last_value(httpEndpoint) as httpEndpoint',
    'last_value(rpcSystem) as rpcSystem',
    'last_value(rpcService) as rpcService',
    'last_value(rpcMethod) as rpcMethod',
    'last_value(paramDirection) as paramDirection',
    'last_value(paramSource) as paramSource',
    'last_value(paramPath) as paramPath',
    'last_value(paramType) as paramType',
    'last_value(paramFormat) as paramFormat',
    'last_value(Timestamp) as Timestamp',
  ]

  const cursorString = typeof cursor?.limit === 'number' && typeof cursor?.skip === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  const query = `SELECT ${fields.join(', ')}
    FROM (
        SELECT DISTINCT ON (collapse_id) *
        FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}
        ${_filter.length ? `WHERE ${_filter}` : ''}
    )
    GROUP BY id
    HAVING sum(Sign) < 0
    ${cursorString}`

  const detections = await Clickhouse.rawSelect(query, returnStream)

  return detections
}

export const getNotAppliedParamDetectionsCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    endpointId?: string,
    componentName?: string[] | string | { $like: string } | { $not: null },
    environmentName?: string[]
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
) => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter(filter)

  const query = `SELECT count()
    FROM (
    SELECT id
    FROM (
        SELECT DISTINCT ON (collapse_id) *
        FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}
        ${_filter.length ? `WHERE ${_filter}` : ''}
    )
    GROUP BY id
    HAVING sum(Sign) < 0
    )`

  const rows = await Clickhouse.rawSelect(query)

  return Number((rows as any[])[0]['count()'] || 0)
}

export const deleteParamDetections = async (filter: {
  workspaceId,
  projectId,
  entityId?,
  Sign?,
  type?: RadarDetectionType | RadarDetectionType[]
}) => {
  await Clickhouse.remove(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}`,
    filter,
  )

  logger.debug({ filter }, 'Deleted http param detections from clickhouse')
}

const getParamDetectionsWithSignQuery = (
  filter: {
    workspaceId: string,
    projectId: string,
    endpointId: string,
    environmentName?: string
    paramDirection?: RadarDetectionParamDirection
    paramSource?: RadarDetectionParamSource
    httpMethod?: HttpMethod,
    httpStatus?: number,
    Sign?: number,
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
) => {
  const conditions = Clickhouse.ClickhouseQueryBuilder.buildFilter({
    ...filter,
    componentAliasName: false,
  })
  const query = `SELECT
    id,
    sum(Sign) as Sign,
    last_value(paramSource) as paramSource,
    last_value(paramPath) as paramPath,
    last_value(paramType) as paramType,
    last_value(paramFormat) as paramFormat,
    last_value(paramDirection) as paramDirection,
    last_value(Timestamp) as Timestamp
  FROM (
      SELECT
        last_value(id) as id,
        last_value(radarStatus.Sign) as Sign,
        last_value(paramSource) as paramSource,
        last_value(paramPath) as paramPath,
        last_value(paramType) as paramType,
        last_value(paramFormat) as paramFormat,
        last_value(paramDirection) as paramDirection,
        last_value(Timestamp) as Timestamp
      FROM (
          SELECT *
          FROM (
              SELECT DISTINCT ON (collapse_id) *
              FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}
              WHERE ${conditions}
          ) as radarData
          INNER JOIN ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME} as radarStatus ON (radarStatus.id = radarData.id)
      )
      GROUP By radarStatus.collapse_id
  )
  GROUP By id`

  return query
}

export const listParamDetectionsWithSign = async (
  filter: {
    workspaceId: string,
    projectId: string,
    endpointId: string,
    environmentName?: string
    paramDirection?: RadarDetectionParamDirection
    paramSource?: RadarDetectionParamSource
    httpMethod?: HttpMethod,
    httpStatus?: number,
    Sign?: number,
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
) => {
  const query = getParamDetectionsWithSignQuery(filter)
  const detections = await Clickhouse.rawSelect(query)

  return detections
}

export const getParamDetectionsWithSignCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    endpointId: string,
    environmentName?: string,
    paramDirection?: RadarDetectionParamDirection,
    paramSource?: RadarDetectionParamSource,
    httpMethod?: HttpMethod,
    httpStatus?: number,
    Sign?: number,
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
) => {
  const query = `SELECT count()
    FROM (${getParamDetectionsWithSignQuery(filter)})`

  const rows = await Clickhouse.rawSelect(query)

  return Number((rows as any[])[0]['count()'] || 0)
}

export const documentTrace = async (
  traceRequest: IExportTraceServiceRequest,
): Promise<void> => {
  const startTime = Timer.startTimer()
  const spansToProcessCount = traceRequest?.resourceSpans?.length || 0
  try {
    totalDocumentationSpansCounter.add(spansToProcessCount)

    if (!spansToProcessCount) {
      return
    }

    const traceId = traceRequest.resourceSpans?.[0]?.scopeSpans?.[0]?.spans?.[0]?.traceId as string


    const integrationId = OtlpLib.getAttributeValue(
      traceRequest.resourceSpans?.[0]?.scopeSpans?.[0]?.spans?.[0]?.attributes,
      ATTR_MULTIPLAYER_INTEGRATION_ID,
    ) as string | undefined

    if (!integrationId) {
      logger.error({ traceId }, '[OTEL-D0C-TRACE] Missing integration id in trace')
      return
    }

    const integration = await IntegrationService.getIntegrationById(integrationId as string)
    const workspaceId = integration.workspace.toString()
    const projectId = integration.project?.toString() as string

    const [
      workspaceFlowFeatureEnabled,
      radarDetectEndpointsFeatureEnabled,
      radarDetectEndpointPayloadFeatureEnabled,
    ] = await Promise.all([
      WorkspaceService.isFeatureFlagEnabled(
        integration.workspace.toString(),
        FeatureFlag.FLOWS,
      ),
      WorkspaceService.isFeatureFlagEnabled(
        integration.workspace.toString(),
        FeatureFlag.RADAR_DETECT_ENDPOINTS,
      ),
      WorkspaceService.isFeatureFlagEnabled(
        integration.workspace.toString(),
        FeatureFlag.RADAR_DETECT_ENDPOINT_PAYLOAD,
      ),
    ])
    if (workspaceFlowFeatureEnabled) {
      const clickhouseSpans = OtlpLib.convertExportTraceToCh(traceRequest)

      await FlowService.saveTemporaryFlowData(
        workspaceId,
        projectId,
        clickhouseSpans,
      )
    }

    let {
      detections: traceDetections,
      httpParams: radarDetectionHttpParams,
    } = await OtelSpanParser.parseTraceRequest(
      traceRequest,
      {
        detectEndpoints: radarDetectEndpointsFeatureEnabled,
        detectEndpointPayload: radarDetectEndpointPayloadFeatureEnabled,
        detectDependencies: workspaceFlowFeatureEnabled,
      },
    )

    await IntegrationService.upsertOtelIntegrationStatus(
      integrationId,
      { otelSpans: true },
    )

    logger.debug({
      integrationId,
      workspaceId,
      projectId,
      traceDetectionsCount: traceDetections.length,
      radarDetectionHttpParamsCount: radarDetectionHttpParams.length,
    }, '[OTEL-D0C-TRACE] Extracted detections from spans')

    traceDetections = removeDuplicatesByKey(
      traceDetections,
      'collapse_id',
    )

    if (traceDetections.length) {
      const cachedDetectionIds = await DetectionCache.mget(
        traceDetections.map(detection => detection.id),
      )

      const filteredDetections = traceDetections
        .filter(detection => !cachedDetectionIds[detection.id])

      if (filteredDetections.length) {
        await Promise.all([
          createDetections(filteredDetections),
          DetectionCache.mset(filteredDetections.map(detection => detection.id)),
          ReleaseService.autoCreateReleaseIfNeeded(filteredDetections),
        ])
      }

      const isAutoMergeActive = await ActiveAutoMergeCache.get(integration._id?.toString())
      if (!isAutoMergeActive) {
        await ActiveAutoMergeCache.set(integration._id?.toString())
      }
    }

    if (
      radarDetectionHttpParams.length
      && radarDetectEndpointPayloadFeatureEnabled
    ) {
      radarDetectionHttpParams = removeDuplicatesByKey(
        radarDetectionHttpParams,
        'collapse_id',
      )
      await createRadarDetectionHttpParams(radarDetectionHttpParams)
    }
  } catch (error) {
    logger.error(error, '[OTEL-D0C-TRACE] Failed to process otel trace from kafka')
    processingDocumentationSpansErrorRate.add(spansToProcessCount)
  } finally {
    const duration = Timer.getDuration(startTime)
    processingDocumentationSpansDuration.record(duration)
  }
}
