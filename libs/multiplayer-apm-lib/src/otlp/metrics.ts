import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { MeterProvider } from '@opentelemetry/sdk-metrics'
import opentelemetry from '@opentelemetry/api'
import { getResource } from './helpers'
import {
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  OTEL_EXPORTER_OTLP_METRICS_PORT,
  OTLP_METRICS_ENABLED,
} from '../config'

let exporter: any = false

if (OTLP_METRICS_ENABLED) {
  exporter = new PrometheusExporter({
    host: '0.0.0.0',
    endpoint: OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
    port: OTEL_EXPORTER_OTLP_METRICS_PORT,
  })
}

const meterProvider = new MeterProvider({
  ...exporter ? { readers: [exporter] } : {},
  resource: getResource(),
})

opentelemetry.metrics.setGlobalMeterProvider(new MeterProvider())

export const createCounter = (counterName: string) => {
  const counter = meterProvider.getMeter('default')
    .createCounter(counterName)

  return counter
}

export const createHistogram = (
  histogramName: string,
  attributes: { unit?: string, description?: string } = {},
) => {
  const histogram = meterProvider.getMeter('default')
    .createHistogram(
      histogramName,
      attributes,
    )


  return histogram
}
