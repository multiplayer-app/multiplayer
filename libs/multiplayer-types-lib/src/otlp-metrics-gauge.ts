export interface OtlpMetricsGauge {
  ResourceAttributes?: Record<string, string>
  ResourceSchemaUrl?: string
  ScopeName?: string
  ScopeVersion?: string
  ScopeAttributes?: Record<string, string>
  ScopeDroppedAttrCount?: number
  ScopeSchemaUrl?: string
  ServiceName?: string
  MetricName: string
  MetricDescription?: string
  MetricUnit: string
  Attributes?: Record<string, string>
  StartTimeUnix: string
  TimeUnix: string
  Value: number
  Flags?: number

  Exemplars?: {
    FilteredAttributes: Record<string, string>[]
    TimeUnix: string[]
    Value: number[]
    SpanId: string[]
    TraceId: string[]
  }
}
