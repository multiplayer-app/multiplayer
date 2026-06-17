import { SourceData } from './source-data'

export enum ApiType {
  OPENAPI = 'OPENAPI',
  ASYNCAPI = 'ASYNCAPI',
  GRAPHQL = 'GRAPHQL',
  GRPC='GRPC',
  OTHER = 'OTHER'
}

export interface ApiView {
  id: string
  name: string
  components?: Record<string, boolean>
  paths?: Record<string, boolean>
  tags?: Record<string, boolean>
}

export interface ApiData extends SourceData {
  contents: string
  extension: string
  metadata?: {
    version?: string
    provider?: ApiType
  },
  views?: Record<string, ApiView>
}
