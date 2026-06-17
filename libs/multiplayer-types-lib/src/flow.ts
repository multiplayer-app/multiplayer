import { HttpMethod } from './enums'

export interface IFlowSequence {
  spanId: string
  parentSpanId?: string
  componentName: string
  httpMethod?: HttpMethod
  httpEndpoint?: string
  name: string
  kind: number

  httpStatus?: number
  messagingSystem?: string
  messagingDestination?: string
  dbSystem?: string
  rpcSystem?: string
  rpcService?: string
  rpcMethod?: string
}

export interface IFlow {
  id: string
  workspaceId: string
  projectId: string
  sequence: IFlowSequence[]
  Timestamp?: string | Date
}
