import * as Clickhouse from '@multiplayer/clickhouse'
import logger from '@multiplayer/logger'
import {
  type IFlow,
  type OtelSpanCh,
  RadarDetectionSource,
  RadarDetectionType,
  RadarDetectionEndpointType,
} from '@multiplayer/types'
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_ROUTE,
} from '@opentelemetry/semantic-conventions'
import { slugifyString } from '@multiplayer/util-shared'
import {
  FlowMetadataModel,
} from '@multiplayer/models'
import {
  FlowsLib,
  RadarDetectionLib,
} from '../libs'
import { FlowCache } from '../cache'
import { ICachedFlow } from '../types'
import {
  replaceIdInString,
} from '../helpers'
import {
  CLICKHOUSE_RADAR_DB,
  CLICKHOUSE_RADAR_FLOWS_TABLE_NAME,
} from '../config'

export const createFlow = async (flow: Omit<IFlow, 'id'>) => {
  await Clickhouse.insert(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    [flow],
    true,
  )

  logger.debug('Inserted flow to clickhouse')
}

export const listFlows = async (
  filter: {
    workspaceId: string,
    projectId: string,
    componentName?: string[] | string | { $like: string } | { $not: null },
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
  cursor?: {
    skip: number,
    limit: number,
  },
): Promise<IFlow[]> => {
  const detectedItems = await Clickhouse.selectDistinct(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    'ON (id) *',
    filter,
    cursor,
    'ORDER BY id',
    'ASC COLLATE \'en\'',
  )

  return detectedItems as IFlow[]
}

export const getFlowById = async (id: string): Promise<IFlow | undefined> => {
  const [flow] = await Clickhouse.selectDistinct(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    'ON (id) *',
    { id },
    {
      skip: 0,
      limit: 1,
    },
  )

  return flow as IFlow | undefined
}

export const getTotalFlowsCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    componentName?: string[] | string | { $like: string } | { $not: null },
    Timestamp?: {
      $lt?: { $date: Date },
      $gt?: { $date: Date }
    }
  },
): Promise<number> => {
  const flowsCount = await Clickhouse.countTotalDistinctValues(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    'id',
    filter,
  )

  return flowsCount
}

export const deleteFlowById = async (
  id: string,
): Promise<void> => {
  await Clickhouse.remove(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    {
      id,
    },
  )
}

export const deleteFlows = async (
  filter: {
    workspaceId: string,
    projectId: string,
    id?: string[]
  },
): Promise<void> => {
  const { id, ..._filter } = filter

  const conditions: any = _filter

  if (id?.length) {
    conditions.id = id
  }

  await Clickhouse.remove(
    `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}`,
    conditions,
  )
}

export const saveTemporaryFlowData = async (
  workspaceId: string,
  projectId: string,
  spans: OtelSpanCh[],
): Promise<void> => {
  if (!spans.length) {
    return
  }

  const rootSpan = spans.find(({ ParentSpanId }) => !ParentSpanId)

  if (rootSpan) {
    const endpoint = replaceIdInString(rootSpan?.SpanAttributes?.[SEMATTRS_HTTP_ROUTE])
      ?.replace(/:([^/]*)/g, '{$1}')
    const method = rootSpan?.SpanAttributes?.[SEMATTRS_HTTP_METHOD]?.toUpperCase()

    if (endpoint && method) {
      const serviceName = slugifyString(rootSpan.ServiceName?.toLowerCase() as string || '')

      const detectionId = RadarDetectionLib.getDetectionId({
        Sign: RadarDetectionSource.RADAR,
        workspaceId,
        projectId,
        type: RadarDetectionType.ENDPOINT,
        componentName: serviceName,
        endpointType: RadarDetectionEndpointType.HTTP,
        httpEndpoint: endpoint,
        httpMethod: method,
        Timestamp: new Date(),
      })

      const existingFlow = await FlowMetadataModel.findFlowMetadataById(detectionId)

      if (existingFlow) {
        return
      }
    }
  }

  const traceId = spans[0].TraceId
  const flow = FlowsLib.extractSequenceFromSpans(spans)

  if (!flow) {
    return
  }

  const cachedFlow = await FlowCache.get(
    workspaceId,
    projectId,
    traceId,
  )

  if (cachedFlow) {
    const mergedFlow: ICachedFlow = {
      ...flow,
      entityPlatformId: flow.entityPlatformId || cachedFlow.entityPlatformId,
      environmentName: flow.environmentName || cachedFlow.environmentName,
      sequence: [
        ...flow.sequence,
        ...cachedFlow.sequence,
      ],
    }

    await FlowCache.set(
      workspaceId,
      projectId,
      traceId,
      mergedFlow,
    )
  } else {
    await FlowCache.set(
      workspaceId,
      projectId,
      traceId,
      flow,
    )
  }
}

export const listUniqueComponentsFromFlows = async (
  filter: {
    workspaceId: string,
    projectId: string,
  },
): Promise<string[]> => {
  const _filter = Clickhouse.ClickhouseQueryBuilder.buildFilter(filter)

  const query = `
    SELECT arrayDistinct(groupArray(arrayJoin(arrayMap((x) -> tupleElement(x, 'componentName'), sequence)))) AS unique_components
    FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_FLOWS_TABLE_NAME}
    WHERE ${_filter}
  `

  const [{ unique_components }] = await Clickhouse.rawSelect(query)

  return unique_components
}
