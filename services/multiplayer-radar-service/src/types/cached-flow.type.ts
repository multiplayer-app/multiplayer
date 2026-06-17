import { HttpMethod } from '@multiplayer/types'

export interface ICachedFlowSequence {
  spanId: string
  parentSpanId?: string
  componentName: string
  name: string
  httpHost?: string
  httpMethod?: HttpMethod
  httpEndpoint?: string
  externalDependency?: string
  kind: number

  httpStatus?: number
  messagingSystem?: string
  messagingDestination?: string
  dbSystem?: string
  rpcSystem?: string
  rpcService?: string
  rpcMethod?: string
}

export interface ICachedFlow {
  workspaceId: string
  projectId: string
  integrationId: string
  entityPlatformId?: string
  environmentName?: string
  sequence: ICachedFlowSequence[]
}
