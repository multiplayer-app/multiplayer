import {
  RadarDetectionType,
  IRadarDetection,
  IRadarDetectionParam,
  RadarDetectionParamDirection,
  HttpMethod,
  RadarDetectionSource,
  IIntegration,
  RadarDetectionEndpointType,
  RadarDetectionDependencyType,
} from '@multiplayer/types'
import { isGzipString, slugifyString } from '@multiplayer/util-shared'
import {
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY_ENCODING,
  ATTR_MULTIPLAYER_HTTP_REQUEST_BODY,
  ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
  ATTR_MULTIPLAYER_PLATFORM_ID,
  ATTR_MULTIPLAYER_PLATFORM_NAME,
} from '@multiplayer-app/session-recorder-node'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_STATUS_CODE,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_URL,
  SEMATTRS_RPC_SYSTEM,
  SEMATTRS_RPC_SERVICE,
  SEMATTRS_RPC_METHOD,
  SEMATTRS_MESSAGING_SYSTEM,
  SEMATTRS_MESSAGING_DESTINATION,
} from '@opentelemetry/semantic-conventions'
import {
  IHttpParam,
  ICachedFlowSequence,
  type IExportTraceServiceRequest,
  type ISpan,
  ESpanKind,
  IKeyValue,
} from '../types'
import {
  RadarDetectionLib,
  OtlpLib,
} from '../libs'
import { OtelSpanCache } from '../cache'
import {
  uncompressHexString,
  replaceIdInString,
} from '../helpers'
import * as EntityService from '../services/entity.service'

const SEMATTRS_MESSAGING_DESTINATION_NAME = 'messaging.destination.name'

interface DetectedHttpEndpoint {
  httpEndpoint: string
  httpMethod: HttpMethod
  httpStatus: number,
  requestBodyParams: IHttpParam[],
  responseBodyParams: IHttpParam[],
  requestHeaderParams: IHttpParam[]
  requestQueryParams: IHttpParam[]
}

export const parseTraceRequest = async (
  serviceTraceRequest: IExportTraceServiceRequest,
  options?: {
    detectEndpoints?: boolean
    detectEndpointPayload?: boolean
    detectDependencies?: boolean
  },
): Promise<{
  detections: IRadarDetection[],
  httpParams: IRadarDetectionParam[],
}> => {
  const detections: IRadarDetection[] = []
  const httpParams: IRadarDetectionParam[] = []

  for (const resourceSpan of serviceTraceRequest.resourceSpans || []) {
    const serviceVersion = getServiceVersion(resourceSpan.resource)
    const serviceName = slugifyString(getServiceName(resourceSpan.resource)?.toLowerCase() as string || 'unknown-service-name')

    let environmentName = getEnvironmentName(resourceSpan.resource)?.toLowerCase()
    if (environmentName) {
      environmentName = slugifyString(environmentName)
    }

    const workspaceId = getWorkspaceIdFromResourceAttributes(resourceSpan.resource)
    const projectId = getProjectIdFromResourceAttributes(resourceSpan.resource)

    if (!workspaceId || !projectId) {
      continue
    }

    let platformId = getPlatformId(resourceSpan.resource)

    if (!platformId) {
      const platformName = getPlatformName(resourceSpan.resource)

      if (platformName) {
        platformId = await EntityService.upsertPlatformInDefaultProjectBranch(
          workspaceId,
          projectId,
          platformName,
        )
      }
    }

    for (const scopeSpan of resourceSpan.scopeSpans || []) {
      for (const span of scopeSpan.spans || []) {
        // const workspaceId = getWorkspaceId(span)
        // const projectId = getProjectId(span)
        const integrationId = getIntegrationId(span)

        if (!workspaceId || !projectId || !integrationId) {
          continue
        }


        if (options?.detectDependencies) {
          await OtelSpanCache.set(
            workspaceId,
            projectId,
            span.traceId as string,
            span.spanId as string,
            { serviceName },
          )
        }

        const rpcSystem = replaceIdInString(
          OtlpLib.getAttributeValue(
            span.attributes,
            SEMATTRS_RPC_SYSTEM,
          ) as string | undefined,
        )
        const rpcService = replaceIdInString(
          OtlpLib.getAttributeValue(
            span.attributes,
            SEMATTRS_RPC_SERVICE,
          ) as string | undefined,
        )
        const rpcMethod = replaceIdInString(
          OtlpLib.getAttributeValue(
            span.attributes,
            SEMATTRS_RPC_METHOD,
          ) as string | undefined,
        )
        const messagingSystem = replaceIdInString(
          OtlpLib.getAttributeValue(
            span.attributes,
            SEMATTRS_MESSAGING_SYSTEM,
          ) as string | undefined,
        )
        let messagingDestination = replaceIdInString(
          OtlpLib.getAttributeValue(
            span.attributes,
            SEMATTRS_MESSAGING_DESTINATION,
          ) as string | undefined,
        )
        if (!messagingDestination) {
          messagingDestination = replaceIdInString(
            OtlpLib.getAttributeValue(
              span.attributes,
              SEMATTRS_MESSAGING_DESTINATION_NAME,
            ) as string | undefined,
          )
        }

        let parentDependency: {
          serviceName: string,
          httpMethod?: HttpMethod,
          httpEndpoint?: string,
          httpStatus?: string,
        } | undefined = undefined


        if (span.parentSpanId && options?.detectDependencies) {
          parentDependency = await OtelSpanCache.get(
            workspaceId,
            projectId,
            span.traceId as string,
            span.parentSpanId as string,
          ) as any || undefined
        }

        const externalDependencyName = OtlpLib.getExternalDependencyNameFromSpan(span)
        // const externalClientId = getExternalClientId(span)

        if (environmentName) {
          const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            type: RadarDetectionType.ENVIRONMENT,
            ...serviceVersion ? { release: serviceVersion } : {},
            environmentName,
            Timestamp: new Date(),
          }

          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              detection,
            ),
            id: RadarDetectionLib.getDetectionId(detection),
            ...detection,
          })
        }

        if (serviceName) {
          const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            type: RadarDetectionType.SERVICE,
            ...serviceVersion ? { release: serviceVersion } : {},
            componentName: serviceName,
            environmentName,
            Timestamp: new Date(),
          }
          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              detection,
            ),
            id: RadarDetectionLib.getDetectionId(detection),
            ...detection,
          })
        }

        let httpEndpoint: DetectedHttpEndpoint | undefined = undefined

        if (options?.detectEndpoints) {
          httpEndpoint = await getHttpEndpoint(
            workspaceId,
            projectId,
            span,
            serviceName as string,
          )
          if (httpEndpoint) {
            const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
              Sign: RadarDetectionSource.RADAR,
              workspaceId,
              projectId,
              integrationId,
              platformId,
              type: RadarDetectionType.ENDPOINT,
              ...serviceVersion ? { release: serviceVersion } : {},
              endpointType: RadarDetectionEndpointType.HTTP,
              componentName: serviceName,
              environmentName,
              httpMethod: httpEndpoint.httpMethod as HttpMethod,
              httpEndpoint: httpEndpoint.httpEndpoint,
              Timestamp: new Date(),
            }


            if (options?.detectEndpointPayload) {
              const paramAdditionalPayload = {
                Sign: RadarDetectionSource.RADAR,
                endpointId: RadarDetectionLib.getDetectionId(detection),
                workspaceId,
                projectId,
                integrationId,
                platformId,
                environmentName,
                componentName: serviceName as string,
                endpointType: RadarDetectionEndpointType.HTTP,
                httpMethod: httpEndpoint.httpMethod as HttpMethod,
                httpEndpoint: httpEndpoint.httpEndpoint,
                httpStatus: httpEndpoint.httpStatus,
              }

              const httpReqBodyParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
                httpEndpoint.requestBodyParams,
                {
                  ...paramAdditionalPayload,
                  paramDirection: RadarDetectionParamDirection.REQUEST,
                },
                RadarDetectionSource.RADAR,
              )
              httpParams.push(...httpReqBodyParams)

              const httpResBodyParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
                httpEndpoint.responseBodyParams,
                {
                  ...paramAdditionalPayload,
                  paramDirection: RadarDetectionParamDirection.RESPONSE,
                },
                RadarDetectionSource.RADAR,
              )
              httpParams.push(...httpResBodyParams)

              const httpReqQueryParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
                httpEndpoint.requestQueryParams,
                {
                  ...paramAdditionalPayload,
                  paramDirection: RadarDetectionParamDirection.REQUEST,
                },
                RadarDetectionSource.RADAR,
              )
              httpParams.push(...httpReqQueryParams)

              const httpReqHeaderParams = RadarDetectionLib.formatRadarDetecitonParamsPayload(
                httpEndpoint.requestHeaderParams,
                {
                  ...paramAdditionalPayload,
                  paramDirection: RadarDetectionParamDirection.REQUEST,
                },
                RadarDetectionSource.RADAR,
              )
              httpParams.push(...httpReqHeaderParams)
            }

            detections.push({
              collapse_id: RadarDetectionLib.getDetectionCollapseId(
                RadarDetectionSource.RADAR,
                detection,
              ),
              id: RadarDetectionLib.getDetectionId(detection),
              ...detection,
            })
          }
        }

        if (
          externalDependencyName?.length
          && serviceName.length
          && !parentDependency?.serviceName?.length
          && parentDependency?.serviceName !== serviceName
          && (
            !(rpcMethod || rpcService || rpcSystem)
            && !(messagingDestination || messagingSystem)
          )
          && options?.detectDependencies
        ) {
          const dependencyDetection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            environmentName,
            type: RadarDetectionType.DEPENDENCY,
            dependencyType: RadarDetectionDependencyType.EXTERNAL,
            ...serviceVersion ? { release: serviceVersion } : {},
            sourceComponentName: serviceName,
            targetComponentName: externalDependencyName,
            Timestamp: new Date(),
          }

          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              dependencyDetection,
            ),
            id: RadarDetectionLib.getDetectionId(dependencyDetection),
            ...dependencyDetection,
          })

          const externalServiceDetection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            environmentName,
            type: RadarDetectionType.SERVICE,
            ...serviceVersion ? { release: serviceVersion } : {},
            componentName: externalDependencyName,
            Timestamp: new Date(),
          }
          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              externalServiceDetection,
            ),
            id: RadarDetectionLib.getDetectionId(externalServiceDetection),
            ...externalServiceDetection,
          })
        }

        if (
          (
            rpcSystem
            || rpcService
            || rpcMethod
          )
          && options?.detectEndpoints
        ) {
          const endpointDetection = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            type: RadarDetectionType.ENDPOINT,
            // ...serviceVersion ? { release: serviceVersion } : {},
            endpointType: RadarDetectionEndpointType.RPC,
            componentName: serviceName,
            environmentName,
            rpcSystem: rpcSystem,
            rpcService: rpcService,
            rpcMethod: rpcMethod,
            Timestamp: new Date(),
          }
          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              endpointDetection,
            ),
            id: RadarDetectionLib.getDetectionId(endpointDetection),
            ...endpointDetection,
          })
        }

        if (
          (
            messagingDestination
            || messagingSystem
          )
          && options?.detectEndpoints
        ) {
          const endpointDetection = {
            Sign: RadarDetectionSource.RADAR,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            type: RadarDetectionType.ENDPOINT,
            // ...serviceVersion ? { release: serviceVersion } : {},
            endpointType: RadarDetectionEndpointType.MESSAGING,
            componentName: serviceName,
            environmentName,
            messagingSystem,
            messagingDestination,
            Timestamp: new Date(),
          }
          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              endpointDetection,
            ),
            id: RadarDetectionLib.getDetectionId(endpointDetection),
            ...endpointDetection,
          })
        }

        if (
          options?.detectDependencies
          && parentDependency
          && parentDependency.serviceName?.length
          && serviceName.length
          && parentDependency.serviceName !== serviceName
        ) {
          const detection: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
            Sign: RadarDetectionSource.RADAR,
            type: RadarDetectionType.DEPENDENCY,
            workspaceId,
            projectId,
            integrationId,
            platformId,
            environmentName,
            dependencyType: RadarDetectionDependencyType.INTERNAL,
            sourceComponentName: parentDependency.serviceName as string,
            targetComponentName: serviceName as string,
            Timestamp: new Date(),
          }

          if (
            messagingSystem
            || messagingDestination
          ) {
            detection.targetEndpointType = RadarDetectionEndpointType.MESSAGING
            detection.targetMessagingSystem = messagingSystem
            detection.targetMessagingDestination = messagingDestination
          }

          if (
            rpcSystem
            || rpcService
            || rpcMethod
          ) {
            detection.targetEndpointType = RadarDetectionEndpointType.RPC
            detection.targetRpcSystem = rpcSystem
            detection.targetRpcService = rpcService
            detection.targetRpcMethod = rpcMethod
          }

          if (
            parentDependency.httpMethod
            && parentDependency.httpEndpoint
          ) {
            detection.sourceEndpointType = RadarDetectionEndpointType.HTTP
            detection.sourceHttpMethod = parentDependency.httpMethod
            detection.sourceHttpEndpoint = parentDependency.httpEndpoint
          }

          if (
            httpEndpoint
            && httpEndpoint?.httpMethod
            && httpEndpoint?.httpEndpoint
          ) {
            detection.targetEndpointType = RadarDetectionEndpointType.HTTP
            detection.targetHttpMethod = httpEndpoint.httpMethod
            detection.targetHttpEndpoint = httpEndpoint.httpEndpoint
          }

          detections.push({
            collapse_id: RadarDetectionLib.getDetectionCollapseId(
              RadarDetectionSource.RADAR,
              detection,
            ),
            id: RadarDetectionLib.getDetectionId(detection),
            ...detection,
          })
        }
      }
    }
  }

  const uniqueDetections = [...new Map(detections.map(detection => [
    detection.id,
    detection,
  ])).values()]

  return {
    detections: uniqueDetections,
    httpParams,
    // deepDependencies,
  }
}

export const getHttpEndpoint = async (
  workspaceId: string,
  projectId: string,
  span: ISpan,
  serviceName: string,
): Promise<{
  httpEndpoint: string
  httpMethod: HttpMethod
  httpStatus: number,
  requestBodyParams: IHttpParam[],
  responseBodyParams: IHttpParam[],
  requestHeaderParams: IHttpParam[]
  requestQueryParams: IHttpParam[]
} | undefined> => {
  if (span.kind !== ESpanKind.SPAN_KIND_SERVER) {
    return undefined
  }

  const requestUrl = OtlpLib.getAttributeValue(
    span.attributes,
    SEMATTRS_HTTP_URL,
  ) as string | undefined
  const endpoint = replaceIdInString(
    (OtlpLib.getAttributeValue(
      span.attributes,
      SEMATTRS_HTTP_ROUTE,
    ) as string | undefined || '').replace(/:([^/]*)/g, '{$1}'),
  )


  // if (!endpoint && requestUrl) {
  //   endpoint = OtelLib.getAttributeValue(
  //     span.attributes,
  //     SEMATTRS_HTTP_ROUTE,
  //   ) as string | undefined || ''
  //   endpoint = requestUrl.replace(/(^\w+:|^)\/\/[^/]*/, '').replace(/#.*/, '')
  // }

  const method = (OtlpLib.getAttributeValue(
    span.attributes,
    SEMATTRS_HTTP_METHOD,
  ) as string | undefined || '')?.toUpperCase()
    || (OtlpLib.getAttributeValue(
      span.attributes,
      'http.request.method',
    ) as string | undefined || '')?.toUpperCase()
  const status = (OtlpLib.getAttributeValue(
    span.attributes,
    SEMATTRS_HTTP_STATUS_CODE,
  )
    || OtlpLib.getAttributeValue(
      span.attributes,
      'http.response.status_code',
    )) as string | undefined

  if (!endpoint?.length || !method?.length || !status) {
    return undefined
  }

  await OtelSpanCache.set(
    workspaceId,
    projectId,
    span.traceId as string,
    span.spanId as string,
    {
      serviceName,
      httpMethod: method as HttpMethod,
      httpEndpoint: endpoint,
      httpStatus: status,
    },
  )

  const requestBodyAttributePayload = OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_HTTP_REQUEST_BODY,
  ) as string | undefined

  let responseBodyAttributePayload = OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY,
  ) as string | undefined
  const isResponseBodyCompressed = OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY_ENCODING,
  ) === 'gzip'
    || (
      responseBodyAttributePayload?.length
      && isGzipString(responseBodyAttributePayload)
    )

  if (
    isResponseBodyCompressed
    && responseBodyAttributePayload
  ) {
    responseBodyAttributePayload = (await uncompressHexString(responseBodyAttributePayload)).toString('utf-8')
  }

  const requestHeadersAttributePayload = OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS,
  ) as string | undefined

  const requestBodyParams = RadarDetectionLib.getHttpBodyParams(requestBodyAttributePayload)
  const responseBodyParams = RadarDetectionLib.getHttpBodyParams(responseBodyAttributePayload)
  const requestHeaderParams = RadarDetectionLib.getHttpHeaderParams(requestHeadersAttributePayload)
  const requestQueryParams = RadarDetectionLib.getHttpQueryParams(requestUrl)

  return {
    httpEndpoint: endpoint,
    httpMethod: method as HttpMethod,
    httpStatus: Number(status),
    requestBodyParams,
    responseBodyParams,
    requestHeaderParams,
    requestQueryParams,
  }
}

export const extractExternalComponentsFromFlowSequence = (
  workspaceId: string,
  projectId: string,
  integrationId: string,
  flowSequence: ICachedFlowSequence[],
): IRadarDetection[] => {
  let detections: IRadarDetection[] = []

  const sequencesWithExternalCalls = flowSequence.filter(sequence => {
    const isHttpCallSpan = sequence.kind === ESpanKind.SPAN_KIND_CLIENT
      && sequence.httpHost
      && !sequence.rpcMethod
      && !sequence.rpcService
      && !sequence.rpcSystem
      && !sequence.messagingDestination
      && !sequence.messagingSystem
      && !sequence.dbSystem
      && !flowSequence.find(span => span.parentSpanId === sequence.spanId)

    if (!isHttpCallSpan) {
      return
    }

    const parentSpanId = sequence.parentSpanId as string
    const parentSpan = flowSequence.find(span => span.spanId === parentSpanId)

    if (
      !parentSpan
      || (
        (
          parentSpan.rpcMethod
          || parentSpan.rpcService
          || parentSpan.rpcSystem
        )
        && parentSpan.kind === ESpanKind.SPAN_KIND_CLIENT
      )
    ) {
      return false
    }

    return true
  })

  if (!sequencesWithExternalCalls.length) {
    return detections
  }

  detections = sequencesWithExternalCalls.flatMap(sequence => {
    const [hostname] = (sequence.httpHost as string).split(':')
    const httpHostComponentName = slugifyString(hostname)

    const serviceDetectionBase: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.RADAR,
      workspaceId,
      projectId,
      integrationId,
      type: RadarDetectionType.SERVICE,
      componentName: httpHostComponentName,
      hostname: sequence.httpHost as string,
      Timestamp: new Date(),
    }
    const dependencyDetectionBase: Omit<IRadarDetection, 'id' | 'collapse_id'> = {
      Sign: RadarDetectionSource.RADAR,
      workspaceId,
      projectId,
      integrationId,
      type: RadarDetectionType.DEPENDENCY,
      sourceComponentName: sequence.componentName,
      targetComponentName: httpHostComponentName,
      Timestamp: new Date(),
    }

    return [
      RadarDetectionLib.injectIdToDependency(serviceDetectionBase),
      RadarDetectionLib.injectIdToDependency(dependencyDetectionBase),
    ]
  })

  return detections
}

export const getWorkspaceId = (
  span: ISpan,
): string | undefined => {
  return OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_WORKSPACE_ID,
  ) as string | undefined
}

export const getProjectId = (
  span: ISpan,
): string | undefined => {
  return OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_PROJECT_ID,
  ) as string | undefined
}

export const getWorkspaceIdFromResourceAttributes = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  if (!resource) {
    return undefined
  }

  return OtlpLib.getAttributeValue(
    resource?.attributes,
    ATTR_MULTIPLAYER_WORKSPACE_ID,
  ) as string | undefined
}

export const getProjectIdFromResourceAttributes = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  if (!resource) {
    return undefined
  }

  return OtlpLib.getAttributeValue(
    resource?.attributes,
    ATTR_MULTIPLAYER_PROJECT_ID,
  ) as string | undefined
}

export const getIntegrationId = (
  span: ISpan,
): string | undefined => {
  return OtlpLib.getAttributeValue(
    span.attributes,
    ATTR_MULTIPLAYER_INTEGRATION_ID,
  ) as string | undefined
}

export const getServiceName = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  return OtlpLib.getAttributeValue(
    resource?.attributes,
    SEMRESATTRS_SERVICE_NAME,
  ) as string | undefined
}

export const getEnvironmentName = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  return OtlpLib.getAttributeValue(
    resource?.attributes,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  ) as string | undefined
}

const getServiceVersion = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  if (!resource) {
    return undefined
  }

  return OtlpLib.getAttributeValue(
    resource?.attributes,
    SEMRESATTRS_SERVICE_VERSION,
  ) as string | undefined
}

export const getPlatformId = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  if (!resource) {
    return undefined
  }

  return OtlpLib.getAttributeValue(
    resource.attributes,
    ATTR_MULTIPLAYER_PLATFORM_ID,
  ) as string | undefined
}

export const getPlatformName = (
  resource: { attributes?: IKeyValue[] } | undefined,
): string | undefined => {
  if (!resource) {
    return undefined
  }

  return OtlpLib.getAttributeValue(
    resource.attributes,
    ATTR_MULTIPLAYER_PLATFORM_NAME,
  ) as string | undefined
}
