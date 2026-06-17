import crypto from 'crypto'
import redis from '@multiplayer/redis'
import {
  IFlow,
  RadarDetectionSource,
  RadarDetectionType,
  RadarDetectionEndpointType,
} from '@multiplayer/types'
import { FlowMetadataModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { removeDuplicatesByKey } from '@multiplayer/util-shared'
import { ESpanKind } from '../types'
import {
  FlowService,
  RadarDetectionService,
} from '../services'
import { FlowsLib, RadarDetectionLib } from '../libs'
import { FlowCache } from '../cache'
import { OtelSpanParser } from '../util'
import {
  REDIS_OTEL_FLOW_KEY_CACHE_PREFIX,
  REDIS_RADAR_FLOW_WORKER_LOCK_PREFIX,
} from '../config'

export const createFlow = async (key: string) => {
  const [workspaceId, projectId, traceId] = key.replace(REDIS_OTEL_FLOW_KEY_CACHE_PREFIX, '').split(':')
  const lockKey = `${REDIS_RADAR_FLOW_WORKER_LOCK_PREFIX}${key.replace(REDIS_OTEL_FLOW_KEY_CACHE_PREFIX, '')}`
  try {
    if (!key.startsWith(REDIS_OTEL_FLOW_KEY_CACHE_PREFIX)) {
      return
    }

    const locked = await redis.lockKey(lockKey)

    if (!locked) {
      return
    }

    const flow = await FlowCache.get(
      workspaceId,
      projectId,
      traceId,
    )

    if (!flow) {
      return
    }

    if (!FlowsLib.isSequenceValid(flow.sequence)) {
      logger.warn({
        traceId,
        workspaceId: flow.workspaceId,
        projectId: flow.projectId,
      }, '[FLOW-WORKER] Invalid sequence')
      return
    }

    let sequence = FlowsLib.replaceSpanIds(
      FlowsLib.squashSpans(
        FlowsLib.sortSequence(JSON.parse(JSON.stringify(flow.sequence))),
      ),
    )

    if (!sequence.length || sequence.length <= 1) {
      return
    }

    if (
      sequence[0].kind === ESpanKind.SPAN_KIND_CLIENT
      && sequence[1].kind === ESpanKind.SPAN_KIND_SERVER
      && !sequence[0].httpEndpoint
      && sequence[1].httpEndpoint
      && sequence[0].httpMethod === sequence[1].httpMethod
    ) {
      sequence[0].httpEndpoint = sequence[1].httpEndpoint
      sequence[0].name = sequence[1].name
    }

    const httpEndpoint = sequence[0].httpEndpoint
    const httpMethod = sequence[0].httpMethod

    if (!httpEndpoint || !httpMethod) {
      return
    }


    const flowName = sequence[0].name
    sequence = FlowsLib.removeUnnecessaryFieldsFromSequence(sequence)

    if (!FlowsLib.isSuccessSequence(sequence)) {
      return
    }

    if (!FlowsLib.isSequenceValid(sequence)) {
      logger.warn({
        traceId,
        workspaceId: flow.workspaceId,
        projectId: flow.projectId,
      }, '[FLOW-WORKER] Invalid sequence after removing internal spans')
      return
    }

    const externalServiceDetections = OtelSpanParser.extractExternalComponentsFromFlowSequence(
      flow.workspaceId,
      flow.projectId,
      flow.integrationId,
      flow.sequence,
    )

    if (externalServiceDetections.length) {
      const dedupedExternalServiceDetections = removeDuplicatesByKey(
        externalServiceDetections,
        'collapse_id',
      )

      await RadarDetectionService.createDetections(dedupedExternalServiceDetections)
    }

    let serviceName

    if (
      sequence[0].kind === ESpanKind.SPAN_KIND_CLIENT
      && sequence[1].kind === ESpanKind.SPAN_KIND_SERVER
    ) {
      serviceName = sequence[1].componentName
    } else {
      serviceName = sequence[0].componentName
    }

    const rootSpanId = RadarDetectionLib.getDetectionId({
      Sign: RadarDetectionSource.RADAR,
      workspaceId,
      projectId,
      integrationId: flow.integrationId,
      type: RadarDetectionType.ENDPOINT,
      componentName: serviceName,
      endpointType: RadarDetectionEndpointType.HTTP,
      httpEndpoint: sequence[0].httpEndpoint,
      httpMethod: sequence[0].httpMethod,
      Timestamp: new Date(),
    })
    const flowId = crypto.createHash('md5').update(rootSpanId).digest('hex')

    const existingFlow = await FlowMetadataModel.findFlowMetadataById(rootSpanId)

    if (existingFlow) {
      return
    }

    const _flow: IFlow = {
      id: flowId,
      workspaceId: flow.workspaceId,
      projectId: flow.projectId,
      sequence,
      Timestamp: new Date(),
    }

    const componentNames = [...new Set(sequence
      .map(({ componentName }) => componentName))]



    await Promise.all([
      FlowMetadataModel.createFlowMetadata({
        id: flowId,
        workspace: flow.workspaceId,
        project: flow.projectId,
        rootSpanId,
        ...flow.entityPlatformId
          ? { platformIds: [flow.entityPlatformId] }
          : {},
        ...flow.environmentName
          ? { environmentNames: [flow.environmentName] }
          : {},
        componentNames,
        name: flowName,
      }),
      FlowService.createFlow(_flow),
    ])

  } catch (error) {
    logger.error(error, '[FLOW-WORKER] Failed to process expired flow from redis')
  } finally {
    await FlowCache.unset(
      workspaceId,
      projectId,
      traceId,
    )
    await redis.del(lockKey)
  }
}
