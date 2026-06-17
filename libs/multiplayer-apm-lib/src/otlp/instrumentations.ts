import type {
  IncomingMessage,
  RequestOptions,
} from 'http'
import {
  getNodeAutoInstrumentations,
} from '@opentelemetry/auto-instrumentations-node'
import { type Instrumentation } from '@opentelemetry/instrumentation'
import {
  SessionRecorderHttpInstrumentationHooksNode,
} from '@multiplayer-app/session-recorder-node'
import {
  AUTH_HEADER_NAME,
  MAX_REQUEST_RESPONSE_SIZE,
  OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS,
} from '../config'

export const instrumentations: Instrumentation[] = getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    ignoreIncomingRequestHook: (req: IncomingMessage) => {
      if (req.method === 'OPTIONS' || req.url === '/') {
        return true
      }

      const isHealthEndpoint = !!(req?.url?.endsWith('/health') || req?.url?.endsWith('/healthz'))

      return isHealthEndpoint
    },
    ignoreOutgoingRequestHook: (req: RequestOptions) => {
      const host = req?.hostname || req?.host

      if ('x-proxy-req' in (req?.headers || {})) {
        return !!req.headers?.['x-proxy-req']
      }

      if (
        !OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS.length ||
        !host
      ) {
        return false
      }

      return OTEL_IGNORE_OUTGOING_REQUEST_DOMAINS.includes(host)
    },
    responseHook: SessionRecorderHttpInstrumentationHooksNode.responseHook({
      maskHeadersList: [AUTH_HEADER_NAME, 'set-cookie'],
      maxPayloadSizeBytes: MAX_REQUEST_RESPONSE_SIZE,
      isMaskBodyEnabled: false,
      isMaskHeadersEnabled: true,
    }),
    requestHook: SessionRecorderHttpInstrumentationHooksNode.requestHook({
      maskHeadersList: [AUTH_HEADER_NAME, 'cookie'],
      maxPayloadSizeBytes: MAX_REQUEST_RESPONSE_SIZE,
      isMaskBodyEnabled: false,
      isMaskHeadersEnabled: true,
    }),
  },
  '@opentelemetry/instrumentation-express': {
    enabled: true,
    requestHook: (span, info) => {
      span.setAttribute(
        'user.id',
        (info.request.session as any)?.current?.toString(),
      )
    },
  },
  '@opentelemetry/instrumentation-fs': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-dns': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-net': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-nestjs-core': {
    enabled: false,
  },
  '@opentelemetry/instrumentation-mongoose': {
    enabled: true,
    requireParentSpan: false,
    suppressInternalInstrumentation: false,
  },
  '@opentelemetry/instrumentation-mongodb': {
    enabled: true,
    enhancedDatabaseReporting: true,
  },
  '@opentelemetry/instrumentation-amqplib': {
    enabled: true,
  },
  '@opentelemetry/instrumentation-bunyan': {
    enabled: true,
  },
  '@opentelemetry/instrumentation-socket.io': {
    enabled: true,
  },
})
