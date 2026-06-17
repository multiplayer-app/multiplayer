import { metrics } from '@multiplayer/apm'
import logger from '@multiplayer/logger'
import {
  MULTIPLAYER_TRACE_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_SESSION_ID,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
} from '@multiplayer-app/session-recorder-node'
import { Timer } from '@multiplayer/util'
import {
  DebugSessionModel,
} from '@multiplayer/models'
import {
  DebugSessionCreationReasonType,
  DebugSessionEvents,
} from '@multiplayer/types'

import {
  OtlpLib,
} from '../libs'
import * as websocket from '../websocket'
import {
  RadarDetectionService,
  DebugSessionService,
  IntegrationService,
  IssueService,
  ContinuousDebugSessionService,
} from '../services'
import {
  type IExportTraceServiceRequest,
  ATTR_MULTIPLAYER_ISSUE_HASH,
  ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH,
  ATTR_MULTIPLAYER_ISSUE_TITLE_HASH,
} from '../types'
import { WebSocketHelper } from '../helpers'


const totalDebugSpansCounter = metrics.createCounter('processed_debug_spans_total')
const processingDebugSpansErrorRate = metrics.createCounter('processing_debug_spans_error_rate')
const processingDebugSpansDuration = metrics.createHistogram(
  'processing_debug_spans_duration',
  {
    unit: 'ms',
  },
)

const totalContinuousDebugSpansCounter = metrics.createCounter('processed_continuous_debug_spans_total')
const processingContinuousDebugSpansErrorRate = metrics.createCounter('processing_continuous_debug_spans_error_rate')
const processingContinuousDebugSpansDuration = metrics.createHistogram(
  'processing_continuous_debug_spans_duration',
  {
    unit: 'ms',
  },
)


export const handleDebOtelTraceFromKafka = async (
  traceId: string,
  traceRequest: IExportTraceServiceRequest,
) => {
  const spansCount = traceRequest.resourceSpans?.length || 0
  logger.debug({ traceId }, '[OTEL-DEB-TRACE] Processing trace')

  if (
    !traceId.startsWith(MULTIPLAYER_TRACE_DEBUG_PREFIX)
    && !traceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)
  ) {
    logger.error({ traceId }, '[OTEL-DEB-TRACE] Invalid trace id')
    return
  }

  const startTime = Timer.startTimer()
  try {
    totalDebugSpansCounter.add(spansCount)

    await RadarDetectionService.documentTrace(traceRequest)

    const possibleDebugSessionTraceRequest = OtlpLib.filterSpansByTracePrefix(
      traceRequest,
      [
        MULTIPLAYER_TRACE_DEBUG_PREFIX,
        MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
      ],
    )

    if (!possibleDebugSessionTraceRequest.resourceSpans?.length) {
      logger.debug({ traceId }, '[OTEL-DEB-TRACE] Traces empty after filtering. Exitting...')
      return
    }
    let clickhouseSpans = OtlpLib.convertExportTraceToCh(possibleDebugSessionTraceRequest)

    const workspaceId = clickhouseSpans[0].SpanAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID]
    if (!workspaceId) {
      logger.error({ traceId }, '[OTEL-ERROR-TRACE] Missing workspace id in trace')
      return
    }

    const projectId = clickhouseSpans[0].SpanAttributes[ATTR_MULTIPLAYER_PROJECT_ID]
    if (!projectId) {
      logger.error({ traceId }, '[OTEL-ERROR-TRACE] Missing project id in trace')
      return
    }

    const debugSessionId = await DebugSessionService.getDebugSessionIdFromTraceId(
      workspaceId,
      projectId,
      traceId,
    )

    if (!debugSessionId) {
      if (traceId.startsWith(MULTIPLAYER_TRACE_DEBUG_PREFIX)) {
        logger.error({ traceId }, '[OTEL-DEB-TRACE] Debug session not found')
      }
      return
    }

    clickhouseSpans = OtlpLib.injectAttributeToSpans(
      clickhouseSpans,
      [{
        name: ATTR_MULTIPLAYER_SESSION_ID,
        value: debugSessionId,
      }],
    )
    // clickhouseSpans = OtlpLib.filterDebugSessionSpans(clickhouseSpans)
    clickhouseSpans = await OtlpLib.uncompressGzipPayloadInSpan(clickhouseSpans)
    // clickhouseSpans = OtelLib.maskResponsePayload(clickhouseSpans)


    const {
      spanIssueMap,
      debugSession: _debugSessionFromIssueService,
    } = await IssueService.handleIssueInTraceRequest(
      traceRequest,
      false,
    )

    clickhouseSpans = await Promise.all(clickhouseSpans.map(async span => {
      const issue = spanIssueMap[span.SpanId]
      if (!issue) {
        return span
      }

      await DebugSessionModel.addIssueById(
        issue.workspace,
        issue.project,
        debugSessionId,
        {
          issueHash: issue.hash,
          issueTitleHash: issue.titleHash,
          issueComponentHash: issue.componentHash,
          issueCustomHash: issue.customHash,
          spanId: span.SpanId,
          traceId: span.TraceId,
        },
      )

      span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_HASH] = issue.hash
      span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH] = issue.componentHash
      span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_TITLE_HASH] = issue.titleHash

      return span
    }))

    await DebugSessionService.createDebugSessionSpans(clickhouseSpans)

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      WebSocketHelper.getSessionRecordingDataRoomById(debugSessionId),
      DebugSessionEvents.DEBUG_SESSION_OTEL_TRACE_CREATED,
      {
        debugSessionId: debugSessionId,
        data: clickhouseSpans,
      },
    )
  } catch (error) {
    logger.error(error, '[OTEL-DEB-TRACE] Failed to process otel trace from kafka')
    processingDebugSpansErrorRate.add(spansCount)
  } finally {
    const duration = Timer.getDuration(startTime)
    processingDebugSpansDuration.record(duration)
  }
}

export const handleD0cOtelTraceFromKafka = async (
  traceId: string,
  traceRequest: IExportTraceServiceRequest,
) => {
  await RadarDetectionService.documentTrace(traceRequest)
}

export const handleCdbOtelTraceFromKafka = async (
  traceId: string,
  traceRequest: IExportTraceServiceRequest,
) => {
  const startTime = Timer.startTimer()
  const spansCount = traceRequest.resourceSpans?.length || 0
  try {
    totalContinuousDebugSpansCounter.add(spansCount)

    let spans = OtlpLib.convertExportTraceToCh(traceRequest)

    const continuousDebugSessionShortId = traceId.substring(
      MULTIPLAYER_TRACE_DEBUG_PREFIX.length,
      MULTIPLAYER_TRACE_DEBUG_PREFIX.length + MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
    )

    await ContinuousDebugSessionService.getContinuousDebugSessionById(continuousDebugSessionShortId)

    spans = OtlpLib.injectAttributeToSpans(
      spans,
      [{
        name: ATTR_MULTIPLAYER_SESSION_ID,
        value: continuousDebugSessionShortId,
      }],
    )

    spans = await OtlpLib.uncompressGzipPayloadInSpan(spans)
    // clickhouseSpans = OtelLib.maskResponsePayload(clickhouseSpans)

    const {
      spanIssueMap,
      debugSession: _debugSessionFromIssueService,
    } = await IssueService.handleIssueInTraceRequest(
      traceRequest,
      false,
    )

    if (Object.keys(spanIssueMap).length) {
      const debugSession = await ContinuousDebugSessionService.saveContinuousDebugSession(
        continuousDebugSessionShortId,
        {},
        DebugSessionCreationReasonType.AUTO,
      )

      spans = await Promise.all(spans.map(async span => {
        const issue = spanIssueMap[span.SpanId]
        if (!issue) {
          return span
        }

        await DebugSessionModel.addIssueById(
          debugSession.workspace,
          debugSession.project,
          debugSession.shortId,
          {
            issueHash: issue.hash,
            issueTitleHash: issue.titleHash,
            issueComponentHash: issue.componentHash,
            issueCustomHash: issue.customHash,
            spanId: span.SpanId,
            traceId: span.TraceId,
          },
        )

        span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_HASH] = issue.hash
        span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_COMPONENT_HASH] = issue.componentHash
        span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_TITLE_HASH] = issue.titleHash

        return span
      }))
    }

    await ContinuousDebugSessionService.createContinuousDebugSessionSpans(spans)

    const integrationId = spans[0]?.SpanAttributes?.[ATTR_MULTIPLAYER_INTEGRATION_ID]
    await IntegrationService.upsertOtelIntegrationStatus(
      integrationId,
      { otelSpans: true },
    )

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      spans[0]?.SpanAttributes?.[ATTR_MULTIPLAYER_WORKSPACE_ID],
      spans[0]?.SpanAttributes?.[ATTR_MULTIPLAYER_PROJECT_ID],
      WebSocketHelper.getSessionRecordingDataRoomById(continuousDebugSessionShortId),
      DebugSessionEvents.DEBUG_SESSION_OTEL_TRACE_CREATED,
      {
        debugSessionId: continuousDebugSessionShortId,
        data: spans,
      },
    )
  } catch (error) {
    logger.error(error, '[OTEL-CDB-TRACE] Failed to process otel trace from kafka')
    processingContinuousDebugSpansErrorRate.add(spansCount)
  } finally {
    const duration = Timer.getDuration(startTime)
    processingContinuousDebugSpansDuration.record(duration)
  }
}

export const handleErrorTraceFromKafka = async (
  traceId: string,
  traceRequest: IExportTraceServiceRequest,
) => {
  await IssueService.handleIssueInTraceRequest(
    traceRequest,
    true,
  )
}
