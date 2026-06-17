import { HttpMethod } from './enums/http-method.enum'
import {
  // RadarDetectionSource,
  RadarDetectionEndpointType,
} from './enums'

export interface IRadarDetectionDependency {
  collapse_id: string
  id: string

  workspaceId: string
  projectId: string
  integrationId?: string
  platformId?: string

  environmentName?: string
  endpointType: RadarDetectionEndpointType

  sourceComponentName?: string
  targetComponentName?: string

  httpMethod?: HttpMethod
  httpEndpoint?: string

  rpcSystem?: string
  rpcService?: string
  rpcMethod?: string

  messagingDestination?: string

  Timestamp: Date
}
