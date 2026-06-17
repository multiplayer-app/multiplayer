import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { extractOtelHeadersFromEnv } from './helpers'

export const getLogRecordProcessor = (endpoint, headers) => {
  const logExporter = new OTLPLogExporter({
    url: endpoint,
    headers: extractOtelHeadersFromEnv(headers),
    keepAlive: true,
  })

  return new BatchLogRecordProcessor(logExporter)
}
