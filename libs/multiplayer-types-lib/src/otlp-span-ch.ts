export interface OtelSpanCh {
  /*
   * Session recording properties
  `*/
  id?: string
  debugSessionId?: string

  Timestamp: string
  TraceId: string
  SpanId: string
  ParentSpanId?: string
  TraceState?: string
  SpanName: string
  SpanKind: number
  ServiceName: string
  ResourceAttributes: object
  ScopeName?: string
  ScopeVersion?: string
  SpanAttributes: object

  Duration: number
  StatusCode?: string
  StatusMessage?: string

  Events: {
    Timestamp: string
    Name: string
    Attributes: object
  }[]

  Links: {
    TraceId: string
    SpanId: string
    TraceState: string
    Attributes: object
  }[]
}
