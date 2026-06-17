import {
  OtelLogCh,
} from '@multiplayer/types'
import {
  MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
  ATTR_MULTIPLAYER_SESSION_ID,
} from '@multiplayer-app/session-recorder-node'
import { ContinuousDebugSessionCache } from '../cache'

export const filterAndInjectContinuousDebugSessionIdToLogs = async (logs: OtelLogCh[]): Promise<OtelLogCh[]> => {
  const _logs: OtelLogCh[] = []

  for (const _log of logs) {
    const traceId = _log.TraceId
    if (!traceId.startsWith(MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX)) {
      continue
    }

    const shortContinuousdebugSessionId = traceId.substring(
      MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX.length,
      MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX.length + MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
    )

    const continuousDebugSession = await ContinuousDebugSessionCache.get(shortContinuousdebugSessionId)

    if (!continuousDebugSession) {
      continue
    }

    _log.LogAttributes[ATTR_MULTIPLAYER_SESSION_ID] = shortContinuousdebugSessionId
    _log.debugSessionId = shortContinuousdebugSessionId
    _logs.push(_log)
  }

  return _logs
}
