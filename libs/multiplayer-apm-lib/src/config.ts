import * as fs from 'fs'

const PackageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, 'utf-8'))

export const SERVICE_NAME = PackageJson.name.split('/').pop() || 'unknown'
export const SERVICE_VERSION = process.env.SERVICE_VERSION || PackageJson.version || 'unknown'

export const PLATFORM_ENV = process.env.PLATFORM_ENV

export const NODE_ENV = process.env.NODE_ENV

export const OTLP_METRICS_ENABLED = process.env.OTLP_METRICS_ENABLED === 'true'
export const OTEL_EXPORTER_OTLP_METRICS_ENDPOINT = (process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT as string || '/metrics').replace(/^([^/])/, '/$1')
export const OTEL_EXPORTER_OTLP_METRICS_PORT = process.env.OTEL_EXPORTER_OTLP_METRICS_PORT
  ? Number(process.env.OTEL_EXPORTER_OTLP_METRICS_PORT)
  : 9464
export const OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS = (process.env.OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS || 'collector.newrelic.com')
  .split(',').filter(Boolean)
export const OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT as string
export const OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT as string
export const OTEL_EXPORTER_OTLP_HEADERS = process.env.OTEL_EXPORTER_OTLP_HEADERS as string
export const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true'
export const OTEL_LOG_LEVEL = process.env.OTEL_LOG_LEVEL
export const OTEL_TRACES_SAMPLER_ARG = process.env.OTEL_TRACES_SAMPLER_ARG
  ? Number(process.env.OTEL_TRACES_SAMPLER_ARG)
  : 0.01
export const PROMETHEUS_EXPORTER_ENABLED = process.env.PROMETHEUS_EXPORTER_ENABLED === 'true'
export const PROMETHEUS_EXPORTER_PORT = process.env.PROMETHEUS_EXPORTER_PORT
  ? Number(process.env.PROMETHEUS_EXPORTER_PORT)
  : 4000

export const AUTH_HEADER_NAME = (process.env.AUTH_HEADER_NAME || 'x-api-key').toLowerCase()

export const SCHEMIFY_REQUEST_RESPONSE_PAYLOAD = process.env.SCHEMIFY_REQUEST_RESPONSE_PAYLOAD === 'true' || false
export const SEND_REQUEST_RESPONSE_PAYLOAD = process.env.SEND_REQUEST_RESPONSE_PAYLOAD
  ? process.env.SEND_REQUEST_RESPONSE_PAYLOAD === 'true'
  : true

export const MAX_REQUEST_RESPONSE_SIZE = process.env.MAX_REQUEST_RESPONSE_SIZE
  ? Number(process.env.MAX_REQUEST_RESPONSE_SIZE) || 500000
  : 500000
