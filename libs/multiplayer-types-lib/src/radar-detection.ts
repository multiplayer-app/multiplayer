import { HttpMethod } from './enums/http-method.enum'
import { RadarDetectionType } from './enums/radar-detection-type.enum'
import { RadarDetectionGroupType } from './enums/radar-detection-group-type.enum'
import {
  RadarDetectionSource,
  RadarDetectionEndpointType,
  RadarDetectionDependencyType,
} from './enums'
import { ITag } from './tag'

export interface IRadarDetection {
  collapse_id: string
  id: string

  Sign: RadarDetectionSource
  workspaceId: string
  projectId: string
  integrationId?: string
  platformId?: string
  entityId?: string

  type: RadarDetectionType
  tags?: [string, string][]
  componentName?: string
  hostname?: string

  componentAliasName?: boolean
  mainRefId?: string

  environmentName?: string

  endpointType?: RadarDetectionEndpointType

  httpMethod?: HttpMethod
  httpEndpoint?: string
  rpcSystem?: string
  rpcService?: string
  rpcMethod?: string
  messagingSystem?: string
  messagingDestination?: string

  dependencyType?: RadarDetectionDependencyType

  sourceComponentName?: string
  sourceEntityId?: string
  sourceEndpointType?: RadarDetectionEndpointType
  sourceHttpMethod?: HttpMethod
  sourceHttpEndpoint?: string
  sourceRpcSystem?: string
  sourceRpcService?: string
  sourceRpcMethod?: string
  sourceMessagingSystem?: string
  sourceMessagingDestination?: string

  targetComponentName?: string
  targetEntityId?: string
  targetEndpointType?: RadarDetectionEndpointType
  targetHttpMethod?: HttpMethod
  targetHttpEndpoint?: string
  targetRpcSystem?: string
  targetRpcService?: string
  targetRpcMethod?: string
  targetMessagingSystem?: string
  targetMessagingDestination?: string

  Timestamp: Date

  platformIds?: string[] // aggregated field
  environmentNames?: string[] // aggregated field
}

export const RadarDetectionGroupTypeToNameMap = {
  [RadarDetectionGroupType.CLIENT]: 'Client',
  [RadarDetectionGroupType.ENVIRONMENT]: 'Environment',
  [RadarDetectionGroupType.EXTERNAL_SERVICE]: 'SaaS',
  [RadarDetectionGroupType.SERVICE]: 'Service',
}
