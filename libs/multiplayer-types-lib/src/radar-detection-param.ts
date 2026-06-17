import { HttpMethod } from './enums/http-method.enum'
import {
  RadarDetectionSource,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
  RadarDetectionEndpointType,
} from './enums'

export interface IRadarDetectionParam {
  collapse_id: string
  id: string
  Sign: RadarDetectionSource
  endpointId: string

  workspaceId: string
  projectId: string
  integrationId?: string
  entityId?: string // present only for data came from MP
  platformId?: string

  environmentName?: string
  componentName: string // present only for data came from RADAR
  componentAliasName?: boolean
  mainRefId?: string

  endpointType: RadarDetectionEndpointType

  httpMethod?: HttpMethod
  httpEndpoint?: string
  httpStatus?: number

  messagingSystem?: string
  messagingDestination?: string

  rpcSystem?: string
  rpcService?: string
  rpcMethod?: string

  paramDirection: RadarDetectionParamDirection
  paramSource: RadarDetectionParamSource
  paramPath?: string
  paramType?: string
  paramFormat?: string

  Timestamp: Date
}
