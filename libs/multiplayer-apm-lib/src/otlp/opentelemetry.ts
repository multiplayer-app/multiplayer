import './metrics'
import {
  NodeSDK,
  type NodeSDKConfiguration,
} from '@opentelemetry/sdk-node'
import {
  ParentBasedSampler,
  TracerProvider,
// AlwaysOnSampler,
// TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace'
import api, {
  DiagConsoleLogger,
  DiagLogLevel,
} from '@opentelemetry/api'
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { LoggerProvider } from '@opentelemetry/sdk-logs'
import {
  SessionRecorderTraceIdRatioBasedSampler,
  SessionRecorderIdGenerator,
} from '@multiplayer-app/session-recorder-node'
import { instrumentations } from './instrumentations'
import {
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  OTEL_EXPORTER_OTLP_HEADERS,
  OTEL_ENABLED,
  OTEL_TRACES_SAMPLER_ARG,
  OTEL_LOG_LEVEL,
} from '../config'
import { getSpanProcessor } from './span-processor'
import { getLogRecordProcessor } from './log-processor'
import { getResource } from './helpers'

if (OTEL_LOG_LEVEL) {
  api.diag.setLogger(new DiagConsoleLogger(),
    DiagLogLevel[OTEL_LOG_LEVEL])
}

export const opentelemetry = () => {
  const resource = getResource()

  const spanProcessors: any[] = []

  // add trace exporter
  if (OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    const spanProcessor = getSpanProcessor(
      OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      OTEL_EXPORTER_OTLP_HEADERS,
    )
    spanProcessors.push(spanProcessor)

    // logger.info({
    //   traceEndpoint: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    // }, '[APM] Added trace exported endpoint')
  }

  // set thirdparty trace exporters
  const traceEndpointKeys = Object.keys(process.env)
    .filter(envVarName => envVarName.startsWith('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_'))
  traceEndpointKeys.forEach(traceEndpointKey => {
    const traceEndpoint = process.env[traceEndpointKey] as string

    if (!traceEndpoint) {
      return
    }

    const envNum = traceEndpointKey.replace('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT_', '')
    const headerEnv = process.env[`OTEL_EXPORTER_OTLP_HEADERS_${envNum}`] || ''

    const spanProcessor = getSpanProcessor(
      traceEndpoint,
      headerEnv,
    )

    spanProcessors.push(spanProcessor)
  })




  const traceProvider = new TracerProvider({
    resource,
    idGenerator: new SessionRecorderIdGenerator(),
    sampler: new ParentBasedSampler({
      root: new SessionRecorderTraceIdRatioBasedSampler(OTEL_TRACES_SAMPLER_ARG),
    }),
    spanProcessors,
    // sampler: new AlwaysOnSampler(),
    // sampler: new TraceIdRatioBasedSampler(0.1),
  })


  const logProcessors: any[] = []

  // add logs exporter
  if (OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
    const logRecordProcessor = getLogRecordProcessor(
      OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
      OTEL_EXPORTER_OTLP_HEADERS,
    )

    logProcessors.push(logRecordProcessor)
  }

  // set thirdparty log exporters
  const logsEndpointKeys = Object.keys(process.env)
    .filter(envVarName => envVarName.startsWith('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT_'))
  logsEndpointKeys.forEach(logsEndpointKey => {
    const logsEndpoint = process.env[logsEndpointKey] as string
    const envNum = logsEndpointKey.replace('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT_', '')
    const headerEnv = process.env[`OTEL_EXPORTER_OTLP_HEADERS_${envNum}`] || ''

    const logRecordProcessor = getLogRecordProcessor(
      logsEndpoint,
      headerEnv,
    )

    logProcessors.push(logRecordProcessor)
  })




  const loggerProvider = new LoggerProvider({
    resource,
    processors: logProcessors,
  })

  const nodeSDKConfiguration: Partial<NodeSDKConfiguration> = {
    instrumentations,
  }


  // TracerProvider doesn't self-register like NodeTracerProvider#register() did. Without the
  // context manager spans lose their parent across async boundaries. The propagator matches
  // what register() installed by default (OTEL_PROPAGATORS=tracecontext,baggage).
  // Must run before sdk.start(): the first global registration wins.
  api.trace.setGlobalTracerProvider(traceProvider)
  api.context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable())
  api.propagation.setGlobalPropagator(new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
    ],
  }))
  api.logs.setGlobalLoggerProvider(loggerProvider)

  const sdk = new NodeSDK(nodeSDKConfiguration)

  sdk.start()
}

if (OTEL_ENABLED) {
  opentelemetry()
}
