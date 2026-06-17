import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { extractOtelHeadersFromEnv } from './helpers'

export const getSpanProcessor = (endpoint, headers) => {
  const traceExporter = new OTLPTraceExporter({
    url: endpoint,
    headers: extractOtelHeadersFromEnv(headers || ''),
  })

  return new BatchSpanProcessor(traceExporter)
}
