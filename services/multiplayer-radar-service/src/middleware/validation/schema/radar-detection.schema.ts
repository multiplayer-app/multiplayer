import { Joi } from '@multiplayer/util'
import {
  RadarDetectionType,
  HttpMethod,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
  RadarDetectionSource,
  RadarDetectionEndpointType,
} from '@multiplayer/types'
import { ClickHouseTypes } from '@multiplayer/clickhouse'

export const listRadarDetectionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sortDirection: Joi.array().items(
      Joi.number().valid(...Object.values(ClickHouseTypes.ClickHouseSortOrder)),
    ),
    sortKey: Joi.array().items(
      Joi.string().max(100),
    ),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    componentNames: Joi.array().items(Joi.string()),
    environmentNames: Joi.array().items(Joi.string()),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    platformIds: Joi.array().items(Joi.string()),
    endpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    sourceComponentNames: Joi.array().items(Joi.string()),
    sourceEndpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    targetComponentNames: Joi.array().items(Joi.string()),
    targetEndpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    beforeTimestamp: Joi.date(),
    afterTimestamp: Joi.date(),
    text: Joi.string(),
    Sign: Joi.alternatives(
      Joi.number().valid(...Object.values(RadarDetectionSource), 0),
      Joi.array().items(Joi.number().valid(...Object.values(RadarDetectionSource), 0)),
    ),
    type: Joi.string().valid(...Object.values(RadarDetectionType)),
    componentAliasName: Joi.boolean(),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .assert(
      'sortDirection.length',
      Joi.ref('sortKey.length'),
    )
    .required(),
})

export const listRadarDetectedDependenciesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sortDirection: Joi.array().items(
      Joi.number().valid(...Object.values(ClickHouseTypes.ClickHouseSortOrder)),
    ),
    sortKey: Joi.array().items(
      Joi.string().max(100),
    ),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    componentNames: Joi.array().items(Joi.string()),
    environmentNames: Joi.array().items(Joi.string()),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    platformIds: Joi.array().items(Joi.string()),
    endpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    sourceComponentNames: Joi.array().items(Joi.string()),
    sourceEndpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    targetComponentNames: Joi.array().items(Joi.string()),
    targetEndpointType: Joi.array().items(
      Joi.string().valid(...Object.values(RadarDetectionEndpointType)),
    ),
    beforeTimestamp: Joi.date(),
    afterTimestamp: Joi.date(),
    text: Joi.string(),
    Sign: Joi.alternatives(
      Joi.number().valid(...Object.values(RadarDetectionSource), 0),
      Joi.array().items(Joi.number().valid(...Object.values(RadarDetectionSource), 0)),
    ),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .assert(
      'sortDirection.length',
      Joi.ref('sortKey.length'),
    )
    .required(),
})

export const listRadarDetectedEnvironmentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({}).required(),
})

export const listRadarDetectedComponentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({}).required(),
})

export const listRadarDetectionsParamsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endpointId: Joi.string().required(),
  }).required(),
  query: Joi.object({
    paramDirection: Joi.string().valid(...Object.values(RadarDetectionParamDirection)),
    paramSource: Joi.string().valid(...Object.values(RadarDetectionParamSource)),
    environmentName: Joi.string(),
    httpMethod: Joi.string().valid(...Object.values(HttpMethod)),
    Sign: Joi.number().valid(...Object.values(RadarDetectionSource)),
    httpStatus: Joi.number(),
    beforeTimestamp: Joi.date(),
    afterTimestamp: Joi.date(),
  })
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})

export const bulkDeleteRadarDetectionsParamsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string()),
    type: Joi.string().valid(...Object.values(RadarDetectionType)),
    Sign: Joi.number().valid(...Object.values(RadarDetectionSource)).required(),
  })
    .xor('ids', 'type')
    .required(),
})
