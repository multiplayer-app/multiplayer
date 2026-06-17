import logger from '@multiplayer/logger'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import { SessionRecorderSdk } from '@multiplayer-app/session-recorder-node'
import {
  type IRadarDetection,
  RadarDetectionType,
  IRadarDetectionParam,
  RadarDetectionSource,
  HttpMethod,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
  RadarDetectionEndpointType,
} from '@multiplayer/types'
import { IHttpParam } from '../types'

const validOpenApiFormats = [
  'uuid',
  'email',
  'int32',
  'int64',
  'float',
  'double',
  'byte',
  'binary',
  'date',
  'date-time',
  'password',
]

const convertSchemaToParams = (_schema, path = ''): {
  paramPath: string
  paramType: string
  paramFormat: string | undefined
}[] => {
  const params: {
    paramPath: string
    paramType: string
    paramFormat: string | undefined
  }[] = []

  if (!_schema) {
    return params
  }

  if (_schema.type === 'object') {
    if (path.length) {
      path = `${path}.`
    }
    for (const key in _schema.properties) {
      const prefix = `${path}${key}`
      params.push(...convertSchemaToParams(_schema.properties[key], prefix))
    }
  } else if (_schema.type === 'array') {
    if (path.length) {
      path = `${path}[]`
    }
    params.push(...convertSchemaToParams(_schema.items, path))
  } else {
    params.push({
      paramPath: path,
      paramType: _schema.type,
      paramFormat: _schema.format,
    })
  }

  return params
}

const removeNotValidFormatFromSchema = (schema) => {
  if (!schema) {
    return {}
  }

  if (
    schema.type
    && schema.format
    && !validOpenApiFormats.includes(schema.format)
  ) {
    delete schema.format
  }

  if (schema.type === 'object') {
    for (const key in schema.properties) {
      schema.properties[key] = removeNotValidFormatFromSchema(schema.properties[key])
    }
  } else if (schema.type === 'array' && schema.items) {
    schema.items = removeNotValidFormatFromSchema(schema.items)
  }

  return schema
}

const isHttpPayloadSchemified = (jsonPayload: object): boolean => {
  try {
    const ajv = new Ajv({ strict: false })
    addFormats(ajv)
    ajv.compile(jsonPayload)

    return true
  } catch (err) {
    return false
  }
}

const getCommonId = (radarDetection: Omit<IRadarDetection, 'id' | 'collapse_id'>): string => {
  if (radarDetection.type === RadarDetectionType.ENVIRONMENT) {
    return `${radarDetection.workspaceId}:${radarDetection.projectId}:${RadarDetectionType.ENVIRONMENT}:${radarDetection.environmentName}`
  } else if (radarDetection.type === RadarDetectionType.DEPENDENCY) {
    return `${radarDetection.workspaceId}:${radarDetection.projectId}:${RadarDetectionType.DEPENDENCY}:${radarDetection.sourceComponentName || ''}:${radarDetection.targetComponentName || ''}`
  } else if (radarDetection.type === RadarDetectionType.ENDPOINT) {
    return `${radarDetection.workspaceId}:${radarDetection.projectId}:${RadarDetectionType.ENDPOINT}:${radarDetection.componentName}:${radarDetection.endpointType}:${radarDetection.httpMethod || radarDetection.rpcSystem || ''}:${encodeURIComponent(radarDetection.httpEndpoint || radarDetection.rpcService || '')}:${radarDetection.rpcMethod || ''}`
  } else if (radarDetection.type === RadarDetectionType.SERVICE) {
    return `${radarDetection.workspaceId}:${radarDetection.projectId}:${RadarDetectionType.SERVICE}:${radarDetection.componentName}`
  }

  throw new Error('Unknown radar detection type')
}

export const getDetectionId = (
  radarDetection: Omit<IRadarDetection, 'id' | 'collapse_id'>,
): string => {
  return getCommonId(radarDetection)
}

export const getDetectionCollapseId = (
  source: RadarDetectionSource,
  radarDetection: Omit<IRadarDetection, 'id' | 'collapse_id'>,
): string => {
  const collapse_id = `${source}:${getDetectionId(radarDetection)}:${radarDetection.platformId || ''}:${radarDetection.environmentName || ''}`

  if (radarDetection.type !== RadarDetectionType.DEPENDENCY) {
    return collapse_id
  }

  return `${collapse_id}:${radarDetection.sourceEndpointType || ''}:${radarDetection.sourceHttpMethod || ''}:${radarDetection.sourceHttpEndpoint || ''}:${radarDetection.sourceRpcSystem || ''}:${radarDetection.sourceRpcService || ''}:${radarDetection.sourceRpcMethod || ''}:${radarDetection.sourceMessagingDestination || ''}:${radarDetection.sourceMessagingSystem || ''}:${radarDetection.targetEndpointType || ''}:${radarDetection.targetHttpMethod || ''}:${radarDetection.targetHttpEndpoint || ''}:${radarDetection.targetRpcSystem || ''}:${radarDetection.targetRpcService || ''}:${radarDetection.targetRpcMethod || ''}:${radarDetection.targetMessagingDestination || ''}:${radarDetection.targetMessagingSystem || ''}`
}

const getCommonParamId = (
  param: Omit<IRadarDetectionParam, 'id' | 'collapse_id'>,
): string => {
  return `${param.workspaceId}:${param.projectId}:${param.componentName}:${RadarDetectionType.ENDPOINT}:${param.endpointType}:${param.paramDirection}:${param.httpMethod || param.rpcSystem || ''}:${encodeURIComponent(param.httpEndpoint || '') || param.rpcService || ''}:${param.httpStatus || '' || param.rpcMethod}:${param.paramSource}:${param.paramPath}`
}

export const getParamId = (
  param: Omit<IRadarDetectionParam, 'id' | 'collapse_id'>,
): string => {
  return getCommonParamId(param)
}

export const getParamCollapseId = (
  source: RadarDetectionSource,
  param: Omit<IRadarDetectionParam, 'id' | 'collapse_id'>,
): string => {
  return `${source}:${getCommonParamId(param)}:${param.platformId || ''}:${param.environmentName || ''}`
}

export const formatRadarDetecitonParamsPayload = (
  params: IHttpParam[],
  additionalPayload: {
    Sign: RadarDetectionSource,
    workspaceId: string,
    projectId: string,
    endpointId: string,
    entityId?: string,
    platformId?: string,
    integrationId?: string,
    environmentName?: string,
    componentName: string,
    componentAliasName?: boolean,

    endpointType: RadarDetectionEndpointType

    httpMethod?: HttpMethod,
    httpEndpoint: string,
    httpStatus?: number,

    rpcSystem?: string
    rpcService?: string
    rpcMethod?: string

    paramDirection: RadarDetectionParamDirection,
  },
  source: RadarDetectionSource,
): IRadarDetectionParam[] => {
  return params.map(param => {
    const _param: Omit<IRadarDetectionParam, 'id' | 'collapse_id'> = {
      ...param,
      ...additionalPayload,
      Timestamp: new Date(),
    }

    return {
      ..._param,
      collapse_id: getParamCollapseId(source, _param),
      id: getParamId(_param),
    }
  })
}

export const getHttpBodyParams = (rawBody: object | string | undefined): IHttpParam[] => {
  try {
    if (!rawBody) {
      return []
    }

    let jsonSchema
    if (typeof rawBody === 'string') {
      if (rawBody.startsWith('{')) {
        jsonSchema = JSON.parse(rawBody)
      } else {
        logger.debug({ rawBody }, '[RADAR-DETECTION-LIB] Not valid json param payload')
        return []
      }
    }

    jsonSchema = removeNotValidFormatFromSchema(jsonSchema)
    const isSchemified = isHttpPayloadSchemified(jsonSchema)

    if (!isSchemified) {
      jsonSchema = SessionRecorderSdk.schemify(jsonSchema, false)
      jsonSchema = removeNotValidFormatFromSchema(jsonSchema)
    }

    const paramsList = convertSchemaToParams(jsonSchema).map(bodyParam => ({
      ...bodyParam,
      paramSource: RadarDetectionParamSource.BODY,
    })).filter(({ paramPath }) => paramPath?.length)

    return paramsList
  } catch (error) {
    logger.debug(error, { rawBody }, '[RADAR-DETECTION-LIB] Error on getting http body params')
    return []
  }
}

export const getHttpHeaderParams = (rawHeaders: string | undefined): IHttpParam[] => {
  try {
    const headerParams: IHttpParam[] = []
    if (!rawHeaders) {
      return []
    }

    const headers = JSON.parse(rawHeaders)

    if (headers['content-type']) {
      headerParams.push({
        paramPath: 'content-type',
        paramType: 'string',
        paramFormat: undefined,
        paramSource: RadarDetectionParamSource.HEADER,
      })
    }

    if (headers['authorization']) {
      headerParams.push({
        paramPath: 'authorization',
        paramType: 'string',
        paramFormat: undefined,
        paramSource: RadarDetectionParamSource.HEADER,
      })
    }

    return headerParams.filter(({ paramPath }) => paramPath?.length)
  } catch (error) {
    logger.error(error, 'Error on getting http header params')
    return []
  }
}

export const getHttpQueryParams = (url: string | undefined): IHttpParam[] => {
  try {
    if (!url) {
      return []
    }

    const rawQueryParams = url.split('?')?.[1]
    if (!rawQueryParams?.length) {
      return []
    }

    const queryParamNames = rawQueryParams.split('&').flatMap(queryParam => queryParam.split('=', 1))

    const queryParamsList: IHttpParam[] = queryParamNames.map(queryParamName => ({
      paramPath: queryParamName,
      paramType: 'string',
      paramFormat: undefined,
      paramSource: RadarDetectionParamSource.QUERY,
    }))

    return queryParamsList.filter(({ paramPath }) => paramPath?.length)
  } catch (error) {
    logger.error(error, 'Error on getting http query params')
    return []
  }
}

export const injectIdToDependency = (
  dependency: Omit<IRadarDetection, 'id' | 'collapse_id'>,
): IRadarDetection => {
  return {
    collapse_id: getDetectionCollapseId(
      dependency.Sign,
      dependency,
    ),
    id: getDetectionId(dependency),
    ...dependency,
  }
}
