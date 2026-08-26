import { metrics } from '@multiplayer/apm'
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
  RadarDetectionModel,
  RadarDetectionParamModel,
} from '@multiplayer/models'
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
  ClickHouseSortOrder,
  type ISortOptions,
  type ICursorOptions,
} from '../store'
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
  RadarDetectionFilterUtil,
} from '../util'

const totalDocumentationSpansCounter = metrics.createCounter('processed_documentation_spans_total')
const processingDocumentationSpansErrorRate = metrics.createCounter('processing_documentation_spans_error_rate')
const processingDocumentationSpansDuration = metrics.createHistogram(
  'processing_documentation_spans_duration',
  {
    unit: 'ms',
  },
)

const { buildMongoFilter, computeSign } = RadarDetectionFilterUtil

const withComputedSign = <T extends { isRadarObserved: boolean, isDocumented: boolean }>(
  document: T,
): Omit<T, 'isRadarObserved' | 'isDocumented'> & { Sign: RadarDetectionSource } => {
  const plain = (document as any).toObject ? (document as any).toObject() : document
  const { isRadarObserved, isDocumented, ...rest } = plain

  return { ...rest, Sign: computeSign({ isRadarObserved, isDocumented }) }
}

const buildMongoSort = (sort?: ISortOptions | ISortOptions[]): Record<string, 1 | -1> => {
  const sortOptions = Array.isArray(sort) ? sort : sort ? [sort] : []

  return sortOptions.reduce((acc, { sortKey, sortDirection }) => {
    acc[sortKey] = sortDirection === ClickHouseSortOrder.DESC ? -1 : 1
    return acc
  }, {} as Record<string, 1 | -1>)
}

// Splits a delete filter's `Sign` (single value, or an array - bulk-delete.ts's
// Sign===SYNCED path deletes with Sign: [DOCS, RADAR] in one call) into which side(s)
// of the document to clear. A filter with no Sign at all (no real call site produces
// this today) conservatively clears both.
const splitDeleteFilterBySign = (
  filter: { Sign?: RadarDetectionSource | RadarDetectionSource[] },
): { clearRadar: boolean, clearDocs: boolean } => {
  const sign = filter.Sign
  const signs = sign === undefined ? undefined : Array.isArray(sign) ? sign : [sign]

  return {
    clearRadar: !signs || signs.includes(RadarDetectionSource.RADAR) || signs.includes(RadarDetectionSource.SYNCED),
    clearDocs: !signs || signs.includes(RadarDetectionSource.DOCS) || signs.includes(RadarDetectionSource.SYNCED),
  }
}

export const createDetections = async (radarDetections: IRadarDetection[]) => {
  const docsDetections: IRadarDetection[] = []
  const liveDetections: IRadarDetection[] = []

  for (const detection of radarDetections) {
    (detection.Sign === RadarDetectionSource.DOCS ? docsDetections : liveDetections).push(detection)
  }

  await Promise.all([
    docsDetections.length
      ? RadarDetectionModel.upsertDocumentation(
        docsDetections.map(({ Sign, platformIds, environmentNames, ...detection }) => detection),
      )
      : undefined,
    liveDetections.length
      ? RadarDetectionModel.upsertRadarObservation(
        liveDetections.map(({ Sign, ...detection }) => {
          const slugifiedDetection = { ...detection }
          if (slugifiedDetection.componentName)
            slugifiedDetection.componentName = slugifyString(slugifiedDetection.componentName)
          if (slugifiedDetection.environmentName)
            slugifiedDetection.environmentName = slugifyString(slugifiedDetection.environmentName)
          if (slugifiedDetection.environmentNames)
            slugifiedDetection.environmentNames = slugifiedDetection.environmentNames.map((name) => slugifyString(name))
          return slugifiedDetection
        }),
      )
      : undefined,
  ])

  logger.debug(`Upserted ${liveDetections.length} radar-observed / ${docsDetections.length} documented detections to mongo`)
}

export const deleteDetections = async (filter: RadarDetectionDeleteFilter) => {
  const { clearRadar, clearDocs } = splitDeleteFilterBySign(filter)
  // Sign here means "which source is asking to forget this detection", not "only
  // detections currently in this state" - it's consumed by splitDeleteFilterBySign
  // above, not the WHERE clause, or it would wrongly exclude documents whose current
  // state isn't the exact single-source state being cleared (e.g. clearing RADAR off
  // an already-SYNCED document).
  const { Sign: _sign, ...matchFilter } = filter
  const mongoFilter = buildMongoFilter(matchFilter)

  await Promise.all([
    clearRadar ? RadarDetectionModel.clearRadarObservation(mongoFilter) : undefined,
    clearDocs ? RadarDetectionModel.clearDocumentation(mongoFilter) : undefined,
  ])

  logger.debug({ filter }, 'Deleted detections')
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
  cursor?: ICursorOptions,
): Promise<IRadarDetection[]> => {
  let query = RadarDetectionModel.find(buildMongoFilter(filter))

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query

  return documents.map(withComputedSign) as IRadarDetection[]
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
  return RadarDetectionModel.countDocuments(buildMongoFilter(filter))
}

export const getNotAppliedDetections = async (
  filter: RadarDetectionQueryFilter,
  cursor?: ICursorOptions,
  returnStream?: boolean,
) => {
  let query = RadarDetectionModel.find(
    buildMongoFilter({ ...filter, Sign: RadarDetectionSource.RADAR }),
  )

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query
  const rows = documents.map(withComputedSign)

  return returnStream ? Readable.from(rows) : rows
}

export const listRadarDetectionsWithSign = async (
  filter: RadarDetectionQueryFilter,
  cursor?: ICursorOptions,
  sort?: ISortOptions | ISortOptions[],
  stream = true,
): Promise<any> => {
  let query = RadarDetectionModel.find(buildMongoFilter(filter)).sort(buildMongoSort(sort))

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query
  const rows = documents.map(withComputedSign)

  return stream ? Readable.from(rows) : rows
}

export const getRadarDetectionsWithSignCount = async (filter: RadarDetectionQueryFilter) => {
  return RadarDetectionModel.countDocuments(buildMongoFilter(filter))
}

export const getRadarDetectedEnvironmentNames = async (
  filter: {
    workspaceId: string,
    projectId: string,
  },
): Promise<{ environmentName: string }[]> => {
  const environmentNames: string[] = await RadarDetectionModel.distinct(
    'environmentName',
    buildMongoFilter({ ...filter, type: RadarDetectionType.ENVIRONMENT, Sign: RadarDetectionSource.RADAR }),
  )

  return environmentNames.filter(Boolean).map((environmentName) => ({ environmentName }))
}

export const getDetectedComponents = async (
  filter: {
    workspaceId: string,
    projectId: string,
  },
): Promise<{ componentName: string }[]> => {
  const mongoFilter = buildMongoFilter({
    ...filter,
    type: [RadarDetectionType.DEPENDENCY, RadarDetectionType.SERVICE],
  })

  const [componentNames, sourceComponentNames, targetComponentNames] = await Promise.all([
    RadarDetectionModel.distinct('componentName', mongoFilter),
    RadarDetectionModel.distinct('sourceComponentName', mongoFilter),
    RadarDetectionModel.distinct('targetComponentName', mongoFilter),
  ])

  const uniqueComponentNames = new Set([
    ...componentNames,
    ...sourceComponentNames,
    ...targetComponentNames,
  ].filter(Boolean))

  return [...uniqueComponentNames].map((componentName) => ({ componentName }))
}

export const listRadarDetectedDependencies = async (
  filter: RadarDetectionQueryFilter,
  cursor?: ICursorOptions,
  sort?: ISortOptions | ISortOptions[],
  stream = true,
): Promise<any> => {
  const mongoFilter = {
    ...buildMongoFilter({ ...filter, type: RadarDetectionType.DEPENDENCY }),
    isRadarObserved: true,
    componentAliasName: { $ne: true },
  }

  let query = RadarDetectionModel.find(mongoFilter).sort(buildMongoSort(sort))

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query
  const rows = documents.map(withComputedSign) as IRadarDetection[]

  return stream ? Readable.from(rows) : rows
}

export const getRadarDetectedDependenciesCount = async (filter: RadarDetectionQueryFilter) => {
  return RadarDetectionModel.countDocuments({
    ...buildMongoFilter({ ...filter, type: RadarDetectionType.DEPENDENCY }),
    isRadarObserved: true,
    componentAliasName: { $ne: true },
  })
}

export const getRadarDetectionsWithoutDuplicates = async (
  filter: RadarDetectionQueryFilter,
): Promise<IRadarDetection[]> => {
  // ClickHouse needed DISTINCT ON (collapse_id) here because every physical write was
  // a new row. There's exactly one document per detection id now, so this is just a
  // plain filtered find.
  const documents = await RadarDetectionModel.find(buildMongoFilter(filter))

  return documents.map(withComputedSign) as IRadarDetection[]
}

export const getDetectionById = async (
  id: string,
): Promise<IRadarDetection | undefined> => {
  const document = await RadarDetectionModel.findDetectionById(id)

  return document ? withComputedSign(document) as IRadarDetection : undefined
}


export const createRadarDetectionHttpParams = async (radarDetectionHttpParams: IRadarDetectionParam[]) => {
  const docsParams: IRadarDetectionParam[] = []
  const liveParams: IRadarDetectionParam[] = []

  for (const param of radarDetectionHttpParams) {
    (param.Sign === RadarDetectionSource.DOCS ? docsParams : liveParams).push(param)
  }

  await Promise.all([
    docsParams.length
      ? RadarDetectionParamModel.upsertDocumentation(
        docsParams.map(({ Sign, ...param }) => param),
      )
      : undefined,
    liveParams.length
      ? RadarDetectionParamModel.upsertRadarObservation(
        liveParams.map(({ Sign, ...param }) => param),
      )
      : undefined,
  ])

  logger.debug(`Upserted ${liveParams.length} radar-observed / ${docsParams.length} documented detection params to mongo`)
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
  cursor: ICursorOptions,
): Promise<IRadarDetectionParam[]> => {
  let query = RadarDetectionParamModel.find(buildMongoFilter(filter))

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query

  return documents.map(withComputedSign) as IRadarDetectionParam[]
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
  cursor?: ICursorOptions,
  returnStream?: boolean,
) => {
  let query = RadarDetectionParamModel.find(
    buildMongoFilter({ ...filter, Sign: RadarDetectionSource.RADAR }),
  )

  if (cursor?.skip !== undefined) query = query.skip(cursor.skip)
  if (cursor?.limit !== undefined) query = query.limit(cursor.limit)

  const documents = await query
  const rows = documents.map(withComputedSign)

  return returnStream ? Readable.from(rows) : rows
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
  return RadarDetectionParamModel.countDocuments(
    buildMongoFilter({ ...filter, Sign: RadarDetectionSource.RADAR }),
  )
}

export const deleteParamDetections = async (filter: {
  workspaceId: string,
  projectId: string,
  entityId?: string,
  Sign?: RadarDetectionSource | RadarDetectionSource[],
  type?: RadarDetectionType | RadarDetectionType[]
}) => {
  const { clearRadar, clearDocs } = splitDeleteFilterBySign(filter)
  const { Sign: _sign, ...matchFilter } = filter
  const mongoFilter = buildMongoFilter(matchFilter)

  await Promise.all([
    clearRadar ? RadarDetectionParamModel.clearRadarObservation(mongoFilter) : undefined,
    clearDocs ? RadarDetectionParamModel.clearDocumentation(mongoFilter) : undefined,
  ])

  logger.debug({ filter }, 'Deleted http param detections')
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
  const documents = await RadarDetectionParamModel.find({
    ...buildMongoFilter(filter),
    componentAliasName: false,
  })

  return documents.map(withComputedSign)
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
  return RadarDetectionParamModel.countDocuments({
    ...buildMongoFilter(filter),
    componentAliasName: false,
  })
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
