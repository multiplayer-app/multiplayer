export interface OtelLogCh {
  id: string
  debugSessionId?: string
  Timestamp: string
  TraceId: string
  SpanId: string
  TraceFlags?: number
  SeverityText?: string
  SeverityNumber?: number
  ServiceName: string
  Body: string
  ResourceSchemaUrl?: string
  ResourceAttributes: any
  ScopeSchemaUrl?: string
  ScopeName?: string
  ScopeVersion?: string
  ScopeAttributes: any
  LogAttributes: any & {
    'multiplayer.workspace.id': string,
    'multiplayer.project.id': string
    'multiplayer.integration.id': string
    'multiplayer.debug_session.id': string
  }
}
