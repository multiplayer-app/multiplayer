import * as Clickhouse from '@multiplayer/clickhouse'
import { MongoPayload } from '@multiplayer/util'
import { type RadarDetectionQueryFilter } from '../types'

// THE HALL OF F(SH)AME
// export const getRadarDetectionsQuery = (
//   filter: {
//     workspaceId: string,
//     projectId: string,
//     type?: RadarDetectionType[],
//     componentName?: string[] | string | { $like: string },
//     environmentName?: string[]
//     Timestamp?: {
//       $lt?: { $date: Date },
//       $gt?: { $date: Date }
//     }
//   },
//   cursor?: {
//     skip: number,
//     limit: number,
//   },
// ) => {
//   const cursorString = cursor?.limit && cursor?.skip ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}` : ''

//   const query = `
//     WITH
//       otel_data AS (
//         SELECT
//           mainRefId,
//           type,
//           COALESCE(NULLIF(last_value(component_name.componentName), ''), last_value(componentName)) as componentName,
//           last_value(entityId) as entityId,
//           last_value(id) as id,
//           last_value(Sign) as Sign,
//           workspaceId,
//           projectId,
//           integrationId,
//           endpointType,
//           httpMethod,
//           httpEndpoint,
//           rpcSystem,
//           rpcService,
//           rpcMethod,
//           externalDependencyName,
//           sourceComponentName,
//           targetComponentName,
//           last_value(Timestamp),
//           arrayDistinct(flatten(groupArray(platformIds))) AS platformIds,
//           arrayDistinct(flatten(groupArray(environmentNames))) AS environmentNames
//         FROM (
//           SELECT
//             last_value(entity.entityId) as entityId,
//             coalesce(NULLIF(last_value(entity.mainRefId),''), toString(generateUUIDv4())) as mainRefId,
//             id,
//             last_value(Sign) as Sign,
//             last_value(type) as type,
//             last_value(workspaceId) as workspaceId,
//             last_value(projectId) as projectId,
//             last_value(integrationId) as integrationId,
//             last_value(componentName) as componentName,
//             last_value(endpointType) as endpointType,
//             last_value(httpMethod) as httpMethod,
//             last_value(httpEndpoint) as httpEndpoint,
//             last_value(rpcSystem) as rpcSystem,
//             last_value(rpcService) as rpcService,
//             last_value(rpcMethod) as rpcMethod,
//             last_value(externalDependencyName) as externalDependencyName,
//             last_value(sourceComponentName) as sourceComponentName,
//             last_value(targetComponentName) as targetComponentName,
//             last_value(Timestamp) as Timestamp,
//             arrayDistinct(groupArray(platformId)) AS platformIds,
//             arrayDistinct(arrayFilter(x -> x != '', groupArray(environmentName))) AS environmentNames
//           FROM (
//             SELECT DISTINCT ON (collapse_id) *
//             FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}
//             WHERE ${Clickhouse.ClickhouseQueryBuilder.buildFilter({ Sign: -1, ...filter })}
//           ) as radar_data
//           LEFT OUTER JOIN ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME} as entity
//           ON radar_data.workspaceId = entity.workspaceId
//             AND radar_data.projectId = entity.projectId
//             AND radar_data.componentName = entity.componentName
//             AND entity.Sign = 1
//             AND entity.type = 'SERVICE'
//           GROUP By id
//         ) as data
//         LEFT OUTER JOIN ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME} as component_name
//         ON data.mainRefId = component_name.mainRefId
//           AND component_name.componentAliasName = false
//           AND component_name.Sign = 1
//           AND component_name.type = 'SERVICE'
//         GROUP BY workspaceId, projectId, integrationId, mainRefId, type, endpointType, httpMethod, httpEndpoint, rpcSystem, rpcService, rpcMethod, externalDependencyName, sourceComponentName, targetComponentName
//       ),

//       otel_data_with_sign AS (
//         SELECT
//           componentName,
//           entityId,
//           id,
//           mainRefId,
//           Sign + doc.Sign as Sign,
//           type,
//           workspaceId,
//           projectId,
//           integrationId,
//           endpointType,
//           httpMethod,
//           httpEndpoint,
//           rpcSystem,
//           rpcService,
//           rpcMethod,
//           externalDependencyName,
//           sourceComponentName,
//           targetComponentName,
//           Timestamp,
//           platformIds,
//           environmentNames
//         FROM otel_data as otel
//         LEFT JOIN ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME} as doc
//         ON doc.id = otel.id AND doc.Sign = 1
//         WHERE ${Clickhouse.ClickhouseQueryBuilder.buildFilter(filter)}
//       ),

//       docs_data AS (
//         SELECT
//           id,
//           last_value(Sign) as Sign,
//           last_value(type) as type,
//           last_value(mainRefId) as mainRefId,
//           last_value(workspaceId) as workspaceId,
//           last_value(projectId) as projectId,
//           last_value(integrationId) as integrationId,
//           last_value(platformId) as platformId,
//           last_value(entityId) as entityId,
//           last_value(componentName) as componentName,
//           last_value(componentAliasName) as componentAliasName,
//           last_value(environmentName) as environmentName,
//           last_value(endpointType) as endpointType,
//           last_value(httpMethod) as httpMethod,
//           last_value(httpEndpoint) as httpEndpoint,
//           last_value(rpcSystem) as rpcSystem,
//           last_value(rpcService) as rpcService,
//           last_value(rpcMethod) as rpcMethod,
//           last_value(externalDependencyName) as externalDependencyName,
//           last_value(sourceComponentName) as sourceComponentName,
//           last_value(targetComponentName) as targetComponentName,
//           last_value(Timestamp) as Timestamp
//         FROM (
//           SELECT DISTINCT ON (collapse_id) *
//           FROM ${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}
//           WHERE ${Clickhouse.ClickhouseQueryBuilder.buildFilter({ Sign: 1, ...filter })}
//         )
//         GROUP BY id
//       ),

//       docs_grouped_by_alias as (
//         SELECT
//           mainRefId,
//           last_value(id) as id,
//           min(Sign) as Sign,
//           last_value(type) as type,
//           last_value(workspaceId) as workspaceId,
//           last_value(projectId) as projectId,
//           last_value(integrationId) as integrationId,
//           last_value(platformId) as platformId,
//           last_value(entityId) as entityId,
//           MAX(IF(componentAliasName = false, componentName, '')) AS componentName,
//           last_value(environmentName) as environmentName,
//           last_value(endpointType) as endpointType,
//           last_value(httpMethod) as httpMethod,
//           last_value(httpEndpoint) as httpEndpoint,
//           last_value(rpcSystem) as rpcSystem,
//           last_value(rpcService) as rpcService,
//           last_value(rpcMethod) as rpcMethod,
//           last_value(externalDependencyName) as externalDependencyName,
//           last_value(sourceComponentName) as sourceComponentName,
//           last_value(targetComponentName) as targetComponentName,
//           last_value(Timestamp) as Timestamp,
//           [] as platformIds,
//           [] as environmentNames
//         FROM (
//           SELECT
//             id,
//             last_value(Sign) + last_value(otel.Sign) as Sign,
//             last_value(type) as type,
//             last_value(mainRefId) as mainRefId,
//             last_value(workspaceId) as workspaceId,
//             last_value(projectId) as projectId,
//             last_value(integrationId) as integrationId,
//             last_value(platformId) as platformId,
//             last_value(entityId) as entityId,
//             last_value(componentName) as componentName,
//             last_value(componentAliasName) as componentAliasName,
//             last_value(environmentName) as environmentName,
//             last_value(endpointType) as endpointType,
//             last_value(httpMethod) as httpMethod,
//             last_value(httpEndpoint) as httpEndpoint,
//             last_value(rpcSystem) as rpcSystem,
//             last_value(rpcService) as rpcService,
//             last_value(rpcMethod) as rpcMethod,
//             last_value(externalDependencyName) as externalDependencyName,
//             last_value(sourceComponentName) as sourceComponentName,
//             last_value(targetComponentName) as targetComponentName,
//             last_value(Timestamp) as Timestamp
//           FROM docs_data as doc
//           LEFT OUTER JOIN otel_data as otel
//           ON doc.mainRefId = otel.mainRefId
//           GROUP BY id
//         )
//         GROUP BY mainRefId
//       )

//       SELECT
//         componentName,
//         entityId,
//         id,
//         mainRefId,
//         Sign,
//         type,
//         workspaceId,
//         projectId,
//         integrationId,
//         endpointType,
//         httpMethod,
//         httpEndpoint,
//         rpcSystem,
//         rpcService,
//         rpcMethod,
//         externalDependencyName,
//         sourceComponentName,
//         targetComponentName,
//         Timestamp,
//         platformIds,
//         environmentNames
//       FROM otel_data_with_sign
//       UNION ALL
//       SELECT
//         componentName,
//         entityId,
//         id,
//         mainRefId,
//         Sign,
//         type,
//         workspaceId,
//         projectId,
//         integrationId,
//         endpointType,
//         httpMethod,
//         httpEndpoint,
//         rpcSystem,
//         rpcService,
//         rpcMethod,
//         externalDependencyName,
//         sourceComponentName,
//         targetComponentName,
//         Timestamp,
//         platformIds,
//         environmentNames
//       FROM docs_grouped_by_alias WHERE Sign = 1
//       ${cursorString}
//     `

//   return query
// }

export const getRadarDetectionsQuery = (
  filter: RadarDetectionQueryFilter,
  cursor?: {
    skip: number,
    limit: number,
  },
  sort?: Clickhouse.ClickHouseTypes.ISortOptions | Clickhouse.ClickHouseTypes.ISortOptions[],
) => {
  const {
    environmentNames,
    platformIds,
    integrationId,
    tags,
    Timestamp,
    Sign,
    ...filterParamsBeforeGrouping
  } = JSON.parse(JSON.stringify(filter))


  const filterParamsAfterGrouping = MongoPayload.removeUndefinedProps({
    Sign,
    environmentNames,
    platformIds,
    integrationId,
    tags,
    Timestamp,
  })

  const filterBeforeGrouping = Clickhouse.ClickhouseQueryBuilder.buildFilter(filterParamsBeforeGrouping)
  const filterAfterGrouping = Clickhouse.ClickhouseQueryBuilder.buildFilter(filterParamsAfterGrouping)
  const cursorString = typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  let orderString = ''

  if (sort) {
    if (Array.isArray(sort)) {
      if (sort?.length) {
        orderString = `ORDER BY ${sort.map(s => `${s.sortKey} ${s.sortDirection}`).join(', ')}`
      }
    } else if (sort?.sortKey && sort?.sortDirection) {
      orderString = `ORDER BY ${sort.sortKey} ${sort?.sortDirection}`
    }
  }

  const query = `
  WITH

  prefiltered_data AS (
    SELECT DISTINCT ON (collapse_id) *
    FROM radar.detections
    WHERE ${filterBeforeGrouping}
  ),

  calculated_sign_data AS (
    SELECT
      id,
      arrayReduce('sum', arrayDistinct(groupArray(Sign))) as Sign,
      arrayDistinct(arrayFilter(x -> x != '', groupArray(platformId))) AS platformIds,
      arrayDistinct(arrayFilter(x -> x != '', groupArray(environmentName))) AS environmentNames,
      max(componentAliasName) as componentAliasName,
      max(entityId) as entityId,
      max(mainRefId) as mainRefId,
      last_value(componentName) as componentName,
      arrayElement(groupArrayIf(tags, length(tags) > 0), 1) AS tags,
      last_value(type) as type,
      last_value(workspaceId) as workspaceId,
      last_value(projectId) as projectId,
      last_value(integrationId) as integrationId,
      max(hostname) as hostname,
      last_value(endpointType) as endpointType,
      last_value(httpMethod) as httpMethod,
      last_value(httpEndpoint) as httpEndpoint,
      last_value(rpcSystem) as rpcSystem,
      last_value(rpcService) as rpcService,
      last_value(rpcMethod) as rpcMethod,
      last_value(messagingSystem) as messagingSystem,
      last_value(messagingDestination) as messagingDestination,

      last_value(sourceComponentName) as sourceComponentName,
      max(sourceEntityId) as sourceEntityId,
      last_value(sourceEndpointType) as sourceEndpointType,
      last_value(sourceHttpMethod) as sourceHttpMethod,
      last_value(sourceHttpEndpoint) as sourceHttpEndpoint,
      last_value(sourceRpcSystem) as sourceRpcSystem,
      last_value(sourceRpcService) as sourceRpcService,
      last_value(sourceRpcMethod) as sourceRpcMethod,
      last_value(sourceMessagingSystem) as sourceMessagingSystem,
      last_value(sourceMessagingDestination) as sourceMessagingDestination,
      last_value(targetComponentName) as targetComponentName,
      max(targetEntityId) as targetEntityId,
      last_value(targetEndpointType) as targetEndpointType,
      last_value(targetHttpMethod) as targetHttpMethod,
      last_value(targetHttpEndpoint) as targetHttpEndpoint,
      last_value(targetRpcSystem) as targetRpcSystem,
      last_value(targetRpcService) as targetRpcService,
      last_value(targetRpcMethod) as targetRpcMethod,
      last_value(targetMessagingSystem) as targetMessagingSystem,
      last_value(targetMessagingDestination) as targetMessagingDestination,

      max(Timestamp) as Timestamp

    FROM (
      SELECT
        last_value(id) as id,
        COALESCE(NULLIF(last_value(radarStatus.entityId), ''), last_value(entityId)) as entityId,
        MAX(componentAliasName) as componentAliasName,
        COALESCE(NULLIF(last_value(radarStatus.mainRefId), ''), last_value(mainRefId)) as mainRefId,
        last_value(Sign) as Sign,
        last_value(componentName) as componentName,
        last_value(tags) as tags,
        last_value(type) as type,
        last_value(workspaceId) as workspaceId,
        last_value(projectId) as projectId,
        last_value(integrationId) as integrationId,
        max(hostname) as hostname,
        last_value(environmentName) as environmentName,
        last_value(platformId) as platformId,
        last_value(endpointType) as endpointType,
        last_value(httpMethod) as httpMethod,
        last_value(httpEndpoint) as httpEndpoint,
        last_value(rpcSystem) as rpcSystem,
        last_value(rpcService) as rpcService,
        last_value(rpcMethod) as rpcMethod,
        last_value(messagingSystem) as messagingSystem,
        last_value(messagingDestination) as messagingDestination,

        last_value(sourceComponentName) as sourceComponentName,
        max(sourceEntityId) as sourceEntityId,
        last_value(sourceEndpointType) as sourceEndpointType,
        last_value(sourceHttpMethod) as sourceHttpMethod,
        last_value(sourceHttpEndpoint) as sourceHttpEndpoint,
        last_value(sourceRpcSystem) as sourceRpcSystem,
        last_value(sourceRpcService) as sourceRpcService,
        last_value(sourceRpcMethod) as sourceRpcMethod,
        last_value(sourceMessagingSystem) as sourceMessagingSystem,
        last_value(sourceMessagingDestination) as sourceMessagingDestination,
        last_value(targetComponentName) as targetComponentName,
        max(targetEntityId) as targetEntityId,
        last_value(targetEndpointType) as targetEndpointType,
        last_value(targetHttpMethod) as targetHttpMethod,
        last_value(targetHttpEndpoint) as targetHttpEndpoint,
        last_value(targetRpcSystem) as targetRpcSystem,
        last_value(targetRpcService) as targetRpcService,
        last_value(targetRpcMethod) as targetRpcMethod,
        last_value(targetMessagingSystem) as targetMessagingSystem,
        last_value(targetMessagingDestination) as targetMessagingDestination,

        max(Timestamp) as Timestamp

      FROM (
        SELECT *
        FROM prefiltered_data as radarData
        LEFT JOIN prefiltered_data as radarStatus ON (radarStatus.id = radarData.id)
      )
      GROUP By collapse_id
    )
    GROUP By id
  ),

  final_data AS (
    SELECT *
    FROM calculated_sign_data AS matched
    LEFT JOIN (
      SELECT DISTINCT ON (componentName) componentName
      FROM calculated_sign_data
      WHERE Sign < 1
    ) AS nonDocData
      ON matched.componentName = nonDocData.componentName
      WHERE
        Sign < 1
        OR (
          Sign >= 1
          AND (
            nonDocData.componentName != ''
            OR componentAliasName = false
          )
        )
    ORDER BY id
  )

  SELECT *
  FROM final_data
  ${filterAfterGrouping?.length ? `WHERE ${filterAfterGrouping}` : ''}
  ${orderString}
  ${cursorString}
  `

  return query
}

export const getRadarDependencyDetectionsQuery = (
  filter: RadarDetectionQueryFilter,
  cursor?: {
    skip: number,
    limit: number,
  },
  sort?: Clickhouse.ClickHouseTypes.ISortOptions | Clickhouse.ClickHouseTypes.ISortOptions[],
) => {
  const {
    workspaceId,
    projectId,
    type,
    componentName,
    sourceComponentName,
    targetComponentName,
    ...filterParamsAfterGrouping
  } = JSON.parse(JSON.stringify(filter))

  const filterParamsBeforeGrouping = MongoPayload.removeUndefinedProps({
    workspaceId,
    projectId,
    type,
    componentName,
    sourceComponentName,
    targetComponentName,
  })

  const filterBeforeGrouping = Clickhouse.ClickhouseQueryBuilder.buildFilter(filterParamsBeforeGrouping)
  const filterAfterGrouping = Clickhouse.ClickhouseQueryBuilder.buildFilter(filterParamsAfterGrouping)
  const cursorString = typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  let orderString = ''

  if (sort) {
    if (Array.isArray(sort)) {
      if (sort?.length) {
        orderString = `ORDER BY ${sort.map(s => `${s.sortKey} ${s.sortDirection}`).join(', ')}`
      }
    } else if (sort?.sortKey && sort?.sortDirection) {
      orderString = `ORDER BY ${sort.sortKey} ${sort?.sortDirection}`
    }
  }

  const query = `
    WITH
      prefiltered_data AS (
        SELECT DISTINCT ON (collapse_id) *
        FROM radar.detections
        WHERE ${filterBeforeGrouping}
      ),

      calculated_sign_data AS (
        SELECT
          last_value(id) as id,
          COALESCE(NULLIF(last_value(radarStatus.entityId), ''), last_value(entityId)) as entityId,
          MAX(componentAliasName) as componentAliasName,
          COALESCE(NULLIF(last_value(radarStatus.mainRefId), ''), last_value(mainRefId)) as mainRefId,
          last_value(Sign) as Sign,
          last_value(componentName) as componentName,
          max(tags) AS tags,
          last_value(type) as type,
          last_value(workspaceId) as workspaceId,
          last_value(projectId) as projectId,
          last_value(integrationId) as integrationId,
          arrayDistinct(arrayFilter(x -> x != '', groupArray(platformId))) AS platformIds,
          arrayDistinct(arrayFilter(x -> x != '', groupArray(environmentName))) AS environmentNames,
          last_value(endpointType) as endpointType,
          last_value(httpMethod) as httpMethod,
          last_value(httpEndpoint) as httpEndpoint,
          last_value(rpcSystem) as rpcSystem,
          last_value(rpcService) as rpcService,
          last_value(rpcMethod) as rpcMethod,
          last_value(messagingSystem) as messagingSystem,
          last_value(messagingDestination) as messagingDestination,

          last_value(sourceComponentName) as sourceComponentName,
          last_value(sourceEntityId) as sourceEntityId,
          last_value(sourceEndpointType) as sourceEndpointType,
          last_value(sourceHttpMethod) as sourceHttpMethod,
          last_value(sourceHttpEndpoint) as sourceHttpEndpoint,
          last_value(sourceRpcSystem) as sourceRpcSystem,
          last_value(sourceRpcService) as sourceRpcService,
          last_value(sourceRpcMethod) as sourceRpcMethod,
          last_value(sourceMessagingSystem) as sourceMessagingSystem,
          last_value(sourceMessagingDestination) as sourceMessagingDestination,
          last_value(targetComponentName) as targetComponentName,
          last_value(targetEntityId) as targetEntityId,
          last_value(targetEndpointType) as targetEndpointType,
          last_value(targetHttpMethod) as targetHttpMethod,
          last_value(targetHttpEndpoint) as targetHttpEndpoint,
          last_value(targetRpcSystem) as targetRpcSystem,
          last_value(targetRpcService) as targetRpcService,
          last_value(targetRpcMethod) as targetRpcMethod,
          last_value(targetMessagingSystem) as targetMessagingSystem,
          last_value(targetMessagingDestination) as targetMessagingDestination,

          max(Timestamp) as Timestamp
        FROM (
          SELECT
            (Sign + radarStatus.Sign) as Sign,
            COALESCE(NULLIF(radarStatus.sourceComponentName, ''), sourceComponentName) as sourceComponentName,
            COALESCE(NULLIF(radarStatus.sourceEntityId, ''), sourceEntityId) as sourceEntityId,
            COALESCE(NULLIF(radarStatus.sourceEndpointType, ''), sourceEndpointType) as sourceEndpointType,
            COALESCE(NULLIF(radarStatus.sourceHttpMethod, ''), sourceHttpMethod) as sourceHttpMethod,
            COALESCE(NULLIF(radarStatus.sourceHttpEndpoint, ''), sourceHttpEndpoint) as sourceHttpEndpoint,
            COALESCE(NULLIF(radarStatus.sourceRpcSystem, ''), sourceRpcSystem) as sourceRpcSystem,
            COALESCE(NULLIF(radarStatus.sourceRpcService, ''), sourceRpcService) as sourceRpcService,
            COALESCE(NULLIF(radarStatus.sourceRpcMethod, ''), sourceRpcMethod) as sourceRpcMethod,
            COALESCE(NULLIF(radarStatus.sourceMessagingSystem, ''), sourceMessagingSystem) as sourceMessagingSystem,
            COALESCE(NULLIF(radarStatus.sourceMessagingDestination, ''), sourceMessagingDestination) as sourceMessagingDestination,
            COALESCE(NULLIF(radarStatus.targetComponentName, ''), targetComponentName) as targetComponentName,
            COALESCE(NULLIF(radarStatus.targetEntityId, ''), targetEntityId) as targetEntityId,
            COALESCE(NULLIF(radarStatus.targetEndpointType, ''), targetEndpointType) as targetEndpointType,
            COALESCE(NULLIF(radarStatus.targetHttpMethod, ''), targetHttpMethod) as targetHttpMethod,
            COALESCE(NULLIF(radarStatus.targetHttpEndpoint, ''), targetHttpEndpoint) as targetHttpEndpoint,
            COALESCE(NULLIF(radarStatus.targetRpcSystem, ''), targetRpcSystem) as targetRpcSystem,
            COALESCE(NULLIF(radarStatus.targetRpcService, ''), targetRpcService) as targetRpcService,
            COALESCE(NULLIF(radarStatus.targetRpcMethod, ''), targetRpcMethod) as targetRpcMethod,
            COALESCE(NULLIF(radarStatus.targetMessagingSystem, ''), targetMessagingSystem) as targetMessagingSystem,
            COALESCE(NULLIF(radarStatus.targetMessagingDestination, ''), targetMessagingDestination) as targetMessagingDestination,
            *
          FROM prefiltered_data as radarData
          LEFT JOIN prefiltered_data as radarStatus ON (radarStatus.id = radarData.id AND radarData.Sign = radarStatus.Sign * -1)
        )
        GROUP By collapse_id
      ),

      final_data AS (
        SELECT
          last_value(id) as id,
          last_value(entityId) as entityId,
          componentAliasName,
          last_value(mainRefId) as mainRefId,
          last_value(Sign) as Sign,
          last_value(componentName) as componentName,
          max(tags) as tags,
          last_value(type) as type,
          last_value(workspaceId) as workspaceId,
          last_value(projectId) as projectId,
          max(integrationId) as integrationId,
          max(platformIds) as platformIds,
          max(environmentNames) as environmentNames,
          last_value(endpointType) as endpointType,
          last_value(httpMethod) as httpMethod,
          last_value(httpEndpoint) as httpEndpoint,
          last_value(rpcSystem) as rpcSystem,
          last_value(rpcService) as rpcService,
          last_value(rpcMethod) as rpcMethod,
          last_value(messagingSystem) as messagingSystem,
          last_value(messagingDestination) as messagingDestination,

          sourceComponentName,
          max(sourceEntityId) as sourceEntityId,
          sourceEndpointType,
          sourceHttpMethod,
          sourceHttpEndpoint,
          sourceRpcSystem,
          sourceRpcService,
          sourceRpcMethod,
          sourceMessagingSystem,
          sourceMessagingDestination,
          targetComponentName,
          max(targetEntityId) as targetEntityId,
          targetEndpointType,
          targetHttpMethod,
          targetHttpEndpoint,
          targetRpcSystem,
          targetRpcService,
          targetRpcMethod,
          targetMessagingSystem,
          targetMessagingDestination,

          max(Timestamp) as Timestamp
        FROM calculated_sign_data
        GROUP By
          componentAliasName, sourceComponentName, targetComponentName,
          sourceEndpointType, sourceHttpMethod, sourceHttpEndpoint,
          sourceRpcSystem, sourceRpcService, sourceRpcMethod,
          sourceMessagingSystem, sourceMessagingDestination,
          targetEndpointType, targetHttpMethod, targetHttpEndpoint,
          targetRpcSystem, targetRpcService, targetRpcMethod,
          targetMessagingSystem, targetMessagingDestination
      )

    SELECT *
      FROM final_data
      WHERE Sign != 1 AND componentAliasName != true ${filterAfterGrouping?.length ? `AND ${filterAfterGrouping}` : ''}
      ${orderString}
      ${cursorString}
    `

  return query
}
