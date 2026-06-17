import { NotFoundError } from 'restify-errors'
import { IntegrationModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import * as AMQP from '@multiplayer/amqp'
import { ObjectId } from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import {
  IIntegration,
  IRadarDetection,
  RadarDetectionEntityType,
  RadarDetectionType,
  ApplyDetectionMessage,
} from '@multiplayer/types'
import { OtelIntegrationStatusCache } from '../cache'
import { OtelIntegrationStatusType } from '../types/otel-integration-status.type'
import { IntegrationCache } from '../cache'
import * as ProjectBranchService from './project-branch.service'
import * as RadarDetectionService from './radar-detection.service'
import {
  AMQP_RADAR_DETECTION_APPLY_QUEUE,
  REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_LOCK_PREFIX,
  REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX,
} from '../config'


export const upsertOtelIntegrationStatus = async (
  integrationId: string,
  status: OtelIntegrationStatusType,
): Promise<void> => {
  const existingStatus = await OtelIntegrationStatusCache.get(integrationId)

  const _status: OtelIntegrationStatusType = {
    otelLogs: existingStatus?.otelLogs || status?.otelLogs || false,
    otelSpans: existingStatus?.otelSpans || status?.otelSpans || false,
    rrwebEvents: existingStatus?.rrwebEvents || status?.rrwebEvents || false,
  }

  await OtelIntegrationStatusCache.set(integrationId, _status)
}

export const getIntegrationById = async (integrationId: string): Promise<IIntegration> => {
  const cachedIntegration = IntegrationCache.get(integrationId)

  if (cachedIntegration) {
    return cachedIntegration as IIntegration
  }

  const integration = await IntegrationModel.findIntegrationById(integrationId)

  if (!integration) {
    throw new NotFoundError(`Integration with id ${integrationId} not found`)
  }

  const integrationObject = integration.toObject() as any as IIntegration

  IntegrationCache.set(integrationId, integrationObject)

  return integrationObject
}


export const addNotAppliedDetectionsToAutoMergeQueue = async (expiredKey: string) => {
  if (!expiredKey.startsWith(REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX)) {
    return
  }

  const integrationId = expiredKey.replace(REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX, '')

  const lockKey = `${REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_LOCK_PREFIX}${integrationId}`

  try {
    const locked = await redis.lockKey(lockKey)

    if (!locked) {
      return
    }

    const integration = await getIntegrationById(integrationId)

    if (
      !integration
      || !integration.project
      // || !integration?.metadata?.otel?.autoMergeEnabled
      // || !integration?.metadata?.otel?.platformEntity
    ) {
      return
    }

    const detectionsStream = await RadarDetectionService.getNotAppliedDetections({
      workspaceId: integration.workspace,
      projectId: integration.project,
      integrationId: integration._id,
      type: {
        $or: [RadarDetectionType.ENVIRONMENT, RadarDetectionType.SERVICE],
      },
    }, undefined, true)

    const projectBranchId = await ProjectBranchService.getDefaultProjectBranchIdByProjectId(integration.project.toString())

    if (!projectBranchId) {
      return
    }

    for await (const rows of detectionsStream) {
      await Promise.all(rows.map(async row => {
        try {
          const radarDetection = row.json() as IRadarDetection
          await AMQP.publish(
            AMQP_RADAR_DETECTION_APPLY_QUEUE,
            {
              variables: {
                workspaceId: radarDetection.workspaceId,
                projectId: radarDetection.projectId,
                projectBranchId,
                integrationId: integration._id.toString(),
                type: RadarDetectionEntityType.DETECTION,
                // platformEntityId: integration?.metadata?.otel?.platformEntity,
                detection: radarDetection,
              } as ApplyDetectionMessage,
            },
          )
        } catch (detectionHandleError) {
          logger.error(detectionHandleError, 'Failed to publish detection for auto apply')
        }
      }))
    }
  } catch (err) {
    logger.error(err, '[LISTENER] Failed to put detections into auto merge queue')
  } finally {
    await redis.del(lockKey)
  }
}

export const addNotAppliedHttpParamsToAutoMergeQueue = async (integrationId: string | ObjectId) => {
  try {
    const integration = await getIntegrationById(integrationId.toString())

    if (
      !integration
      || !integration.project
    ) {
      return
    }

    const httpParamsStream = await RadarDetectionService.getNotAppliedParamDetections({
      workspaceId: integration.workspace,
      projectId: integration.project,
      integrationId: integration._id,
    }, undefined, true)

    const projectBranchId = await ProjectBranchService.getDefaultProjectBranchIdByProjectId(integration.project.toString())

    if (!projectBranchId) {
      return
    }

    for await (const rows of httpParamsStream) {
      await Promise.all(rows.map(async row => {
        try {
          const httpParamDetection = row.json() as IRadarDetection

          await AMQP.publish(
            AMQP_RADAR_DETECTION_APPLY_QUEUE,
            {
              variables: {
                workspaceId: httpParamDetection.workspaceId,
                projectId: httpParamDetection.projectId,
                projectBranchId,
                type: RadarDetectionEntityType.HTTP_PARAM_DETECTION,
                // platformEntityId: integration?.metadata?.otel?.platformEntity,
                detection: httpParamDetection,
              } as ApplyDetectionMessage,
            },
          )
        } catch (detectionHandleError) {
          logger.error(detectionHandleError, 'Detection handle error')
        }
      }))
    }
  } catch (err) {
    logger.error(err, '[LISTENER] Failed to put http params into auto merge queue')
  }
}
