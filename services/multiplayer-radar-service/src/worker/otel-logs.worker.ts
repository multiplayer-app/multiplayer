import { metrics } from '@multiplayer/apm'
import logger from '@multiplayer/logger'
import {
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_INTEGRATION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
} from '@multiplayer-app/session-recorder-node'
import { Timer } from '@multiplayer/util'
import {
  OtelLogCh,
  DebugSessionEvents,
} from '@multiplayer/types'
import {
  OtlpLib,
} from '../libs'
import {
  DebugSessionService,
  ContinuousDebugSessionService,
  IntegrationService,
} from '../services'
import * as websocket from '../websocket'
import {
  type IExportLogsServiceRequest,
} from '../types'
import {
  WebSocketHelper,
} from '../helpers'

const totalDebugLogsCounter = metrics.createCounter('processed_debug_logs_total')
const processingDebugLogsErrorRate = metrics.createCounter('processing_debug_logs_error_rate')
const processingDebugLogsDuration = metrics.createHistogram(
  'processing_debug_logs_duration',
  {
    unit: 'ms',
  },
)

const totalContinuousDebugLogsCounter = metrics.createCounter('processed_continuous_debug_logs_total')
const processingContinuousDebugLogsErrorRate = metrics.createCounter('processing_continuous_debug_logs_error_rate')
const processingContinuousDebugLogsDuration = metrics.createHistogram(
  'processing_continuous_debug_logs_duration',
  {
    unit: 'ms',
  },
)

export const handleDebOtelLogFromKafka = async (traceId: string, logRequest: IExportLogsServiceRequest) => {
  const startTime = Timer.startTimer()

  try {
    totalDebugLogsCounter.add(1)
    let logs = OtlpLib.convertExportLogsToCh(logRequest)

    logs = (await Promise.all(logs.map(async log => {
      const debugSessionId = await DebugSessionService.getDebugSessionIdFromTraceId(
        log.ResourceAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID],
        log.ResourceAttributes[ATTR_MULTIPLAYER_PROJECT_ID],
        log.TraceId,
      )

      if (!debugSessionId) {
        return undefined
      }

      log.LogAttributes[ATTR_MULTIPLAYER_SESSION_ID] = debugSessionId
      log.debugSessionId = debugSessionId

      return log
    }))).filter(Boolean) as OtelLogCh[]


    if (!logs.length) {
      logger.debug({ traceId }, '[OTEL-DEB-LOG] Logs empty after filtering. Exitting...')
      return
    }

    await DebugSessionService.createDebugSessionLogs(logs)

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      logs[0].ResourceAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID],
      logs[0].ResourceAttributes[ATTR_MULTIPLAYER_PROJECT_ID],
      WebSocketHelper.getSessionRecordingDataRoomById(logs[0].debugSessionId as string),
      DebugSessionEvents.DEBUG_SESSION_OTEL_LOG_CREATED,
      {
        debugSessionId: logs[0].debugSessionId as string,
        data: logs,
      },
    )

    const integrationId = logs[0]?.LogAttributes?.[ATTR_MULTIPLAYER_INTEGRATION_ID]
    await IntegrationService.upsertOtelIntegrationStatus(
      integrationId,
      { otelLogs: true },
    )
  } catch (error) {
    logger.error(
      error,
      '[OTEL-DEB-LOG] Failed to process otel log from kafka',
    )
    processingDebugLogsErrorRate.add(1)
  } finally {
    const duration = Timer.getDuration(startTime)
    processingDebugLogsDuration.record(duration)
  }
}

export const handleCdbOtelLogFromKafka = async (traceId: string, logRequest: IExportLogsServiceRequest) => {
  const startTime = Timer.startTimer()

  try {
    totalContinuousDebugLogsCounter.add(1)

    let logs = OtlpLib.convertExportLogsToCh(logRequest)

    const continuousDebugSessionId = logs?.[0]?.LogAttributes?.[ATTR_MULTIPLAYER_SESSION_ID]
    await ContinuousDebugSessionService.getContinuousDebugSessionById(continuousDebugSessionId)

    logs = OtlpLib.injectAttributeToLogs(
      logs,
      [{
        name: ATTR_MULTIPLAYER_SESSION_ID,
        value: continuousDebugSessionId,
      }],
    )

    await ContinuousDebugSessionService.createContinuousDebugSessionLogs(logs)

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      logs[0].ResourceAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID],
      logs[0].ResourceAttributes[ATTR_MULTIPLAYER_PROJECT_ID],
      WebSocketHelper.getSessionRecordingDataRoomById(continuousDebugSessionId),
      DebugSessionEvents.DEBUG_SESSION_OTEL_LOG_CREATED,
      {
        debugSessionId: continuousDebugSessionId,
        data: logs,
      },
    )

    const integrationId = logs[0]?.LogAttributes?.[ATTR_MULTIPLAYER_INTEGRATION_ID]
    await IntegrationService.upsertOtelIntegrationStatus(
      integrationId,
      { otelLogs: true },
    )
  } catch (error) {
    logger.error(error, '[OTEL-CDB-LOG] Failed to process otel cdb log from kafka')
    processingContinuousDebugLogsErrorRate.add(1)
  } finally {
    const duration = Timer.getDuration(startTime)
    processingContinuousDebugLogsDuration.record(duration)
  }
}
