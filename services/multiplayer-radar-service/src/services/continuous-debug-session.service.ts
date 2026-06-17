import logger from '@multiplayer/logger'
import { Readable } from 'stream'
import {
  IDebugSession,
  IDebugSessionRrwebEvent,
  OtelSpanCh,
  OtelLogCh,
  DebugSessionDataType,
  DebugSessionCreationReasonType,
  AlertRuleConditionType,
  DebugSessionEvents,
  DebugSessionAgentEvents,
} from '@multiplayer/types'
import {
  S3_EXPORT_HOST,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} from '@multiplayer/s3'
import { RandomToken } from '@multiplayer/util'
import * as Clickhouse from '@multiplayer/clickhouse'
import { InvalidArgumentError } from 'restify-errors'
import {
  DebugSessionModel,
  IDebugSessionDocument,
} from '@multiplayer/models'
import {
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
  SessionType,
} from '@multiplayer-app/session-recorder-node'
import { ObjectId } from '@multiplayer/mongo'
import { NotFoundError } from 'restify-errors'
import {
  ContinuousDebugSessionCache,
  DebugSessionShortIdCache,
} from '../cache'
import {
  IContinuousDebugSession,
  ATTR_MULTIPLAYER_USER_HASH,
} from '../types'
import {
  DebugSessionHelper,
  WebSocketHelper,
} from '../helpers'
import * as MetricsService from './metrics.service'
import * as AlertService from './alert.service'
import * as DebugSessionService from './debug-session.service'
import {
  S3_DEBUG_SESSIONS_BUCKET,
  CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME,
  CONTINUOUS_DEBUG_SESSION_DEBOUNCE_SECONDS,
} from '../config'
import * as websocket from '../websocket'
import { OtlpLib } from '../libs'

export const startContinuousDebugSession = async (
  workspace: string,
  project: string,
  debugSessionData?: Partial<IDebugSession>,
): Promise<string> => {
  const shortId = await RandomToken.generateRandomToken(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH)
  const startedAt = new Date()

  await ContinuousDebugSessionCache.set(
    shortId,
    {
      workspace,
      project,
      debugSessionData,
      startedAt,
    },
  )

  return shortId
}

export const getContinuousDebugSessionById = async (
  continuousDebugSessionId: string,
): Promise<IContinuousDebugSession> => {
  const continuousDebugSession = await ContinuousDebugSessionCache.get(continuousDebugSessionId)

  if (!continuousDebugSession) {
    throw new NotFoundError('Continuous debug session not found')
  }

  return continuousDebugSession as IContinuousDebugSession
}

export const cancelContinuousDebugSession = async (continuousDebugSessionId: string): Promise<void> => {
  await ContinuousDebugSessionCache.del(continuousDebugSessionId)
}

export const saveContinuousDebugSession = async (
  continuousDebugSessionShortId: string,
  debugSessionData: Partial<Omit<IDebugSession, 'workspace' | 'project'>> = {},
  creationReason: DebugSessionCreationReasonType = DebugSessionCreationReasonType.MANUAL,
): Promise<IDebugSessionDocument> => {
  const debugSessionShortId = await RandomToken.generateRandomToken(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH)
  const continuousDebugSession = await getContinuousDebugSessionById(continuousDebugSessionShortId)

  const now = new Date()
  let startedAt: Date
  if (
    new Date(continuousDebugSession.startedAt).getTime() + CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS * 1000 < now.getTime()
  ) {
    startedAt = new Date(now.getTime() - (CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS * 1000))
  } else {
    startedAt = new Date(continuousDebugSession.startedAt)
  }
  const stoppedAt = now
  const durationInSeconds = (
    stoppedAt.getTime()
    - new Date(startedAt).getTime()
  ) / 1000
  let debugSession: IDebugSessionDocument | undefined

  if (creationReason === DebugSessionCreationReasonType.AUTO) {
    const debugSessionToDebounce = await DebugSessionModel.findOne({
      workspace: new ObjectId(continuousDebugSession.workspace),
      project: new ObjectId(continuousDebugSession.project),
      continuousDebugSession: continuousDebugSessionShortId,
      finishedS3Transfer: { $ne: true },
      creationReason: DebugSessionCreationReasonType.AUTO,
      stoppedAt: {
        $gte: new Date(now.getTime() - (CONTINUOUS_DEBUG_SESSION_DEBOUNCE_SECONDS * 1000)),
      },
    })

    if (debugSessionToDebounce) {
      await DebugSessionShortIdCache.unset(debugSessionToDebounce.shortId)

      debugSession = await DebugSessionModel.updateDebugSessionById(
        debugSessionToDebounce.workspace,
        debugSessionToDebounce.project,
        debugSessionToDebounce._id,
        {
          startedAt,
          stoppedAt,
          durationInSeconds,
        },
      )
    }
  }

  if (!debugSession) {
    debugSession = await DebugSessionModel.createDebugSession({
      sessionType: SessionType.CONTINUOUS,
      creationReason,
      workspace: continuousDebugSession.workspace,
      project: continuousDebugSession.project,
      shortId: debugSessionShortId,
      startedAt,
      stoppedAt,
      durationInSeconds,
      continuousDebugSession: continuousDebugSessionShortId,
      ...(continuousDebugSession.debugSessionData || {}),
      ...debugSessionData,
    })

    if (debugSession.endUserHash) {
      await MetricsService.createSessionRecordingRateMetric(
        debugSession.workspace,
        debugSession.project,
        debugSession.endUserHash,
        debugSession._id.toString(),
      )
    }

    const _debugSessionUrl = await DebugSessionService.getDebugSessionUrl(debugSession)

    const _debugSession = {
      ...debugSession.toObject(),
      url: _debugSessionUrl,
    }

    await AlertService.sendAlert(
      continuousDebugSession.workspace,
      continuousDebugSession.project,
      {
        sessionRecording: _debugSession,
        conditionType: AlertRuleConditionType.SESSION_RECORDING_CREATED,
      },
    )

    websocket.debugSessionNamespaceHandler.emitMessageToRoom(
      debugSession.workspace,
      debugSession.project,
      WebSocketHelper.getSessionRecordingRoomInProject(debugSession.workspace, debugSession.project),
      DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
      {
        data: _debugSession,
      },
    )

    websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
      WebSocketHelper.getSessionRecordingRoomById(debugSession.continuousDebugSession as string),
      DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
      {
        data: _debugSession,
      },
    )
  }

  await DebugSessionShortIdCache.set(
    debugSession.shortId,
    debugSession._id.toString(),
    40,
  )

  return debugSession
}

export const createContinuousDebugSessionRrwebEvents = async (
  events: (Partial<IDebugSessionRrwebEvent> & { type: number })[],
): Promise<IDebugSessionRrwebEvent[]> => {
  if (!events.length) {
    return []
  }

  const continuousDebugSessionId = events[0].debugSessionId
  if (!events.every(event => event.debugSessionId === continuousDebugSessionId)) {
    throw new InvalidArgumentError('All events should have same continuous-debug-session id')
  }

  if (!continuousDebugSessionId) {
    throw new InvalidArgumentError('Missing continuous-debug-session id')
  }

  const continuousDebugSession = await ContinuousDebugSessionCache.get(continuousDebugSessionId)

  if (!continuousDebugSession) {
    logger.error({
      event: DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE,
      continuousDebugSessionId,
    }, '[Websocket] Debug session not found')

    return []
  }

  logger.debug({
    event: DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE,
    continuousDebugSessionId,
  }, '[Websocket] Got event')

  const _events: Partial<IDebugSessionRrwebEvent>[] = events.map((_event) => ({
    id: new ObjectId().toString(),
    workspaceId: _event.workspaceId,
    projectId: _event.projectId,
    debugSessionId: _event.debugSessionId,
    type: _event.type,
    data: _event.data,
    timestamp: _event.timestamp
      ? new Date(_event.timestamp).toISOString()
      : new Date().toISOString(),
  }))

  const tableName = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME}`

  await Clickhouse.insert(
    tableName,
    _events,
  )

  logger.debug(`[CONTINUOUS_DEBUGGER] Inserted rrweb events ${_events.length} rrweb events to clickhouse (${tableName})`)

  return _events as IDebugSessionRrwebEvent[]
}

export const createContinuousDebugSessionSpans = async (spans: OtelSpanCh[]): Promise<void> => {
  if (!spans?.length) {
    return
  }

  const tableName = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME}`

  await Clickhouse.insert(
    tableName,
    OtlpLib.flattenSpansForClickHouse(spans),
  )

  logger.debug(`[CONTINUOUS_DEBUGGER] Inserted spans ${spans.length} to clickhouse db: ${tableName}`)
}

export const createContinuousDebugSessionLogs = async (logs: OtelLogCh[]): Promise<void> => {
  if (!logs?.length) {
    return
  }
  const tableName = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME}`

  await Clickhouse.insert(
    tableName,
    logs,
  )

  logger.debug(`[CONTINUOUS_DEBUGGER] Inserted logs ${logs.length} to clickhouse db: ${tableName}`)
}

export const moveContinuousDebugSessionDataFromChToS3 = async (
  debugSessionId: string | ObjectId,
) => {
  const debugSession = await DebugSessionService.getDebugSessionById(debugSessionId.toString())

  if (!debugSession) {
    throw new NotFoundError(`Debug session with id ${debugSessionId} not found`)
  }

  try {
    const s3Host = `${S3_EXPORT_HOST}/${S3_DEBUG_SESSIONS_BUCKET}`
    const debugSessionDataFilter: Clickhouse.ClickHouseTypes.FilterQuery = {
      debugSessionId: debugSession.continuousDebugSession,
      Timestamp: {
        $gte: {
          $date: new Date(debugSession.startedAt),
        },
        $lte: {
          $date: new Date(debugSession.stoppedAt),
        },
      },
    }
    const replace = {
      debugSessionId: debugSessionId.toString(),
    }

    // move logs
    const logsTable = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME}`
    const s3LogsFileId = new ObjectId()
    const s3LogsFileKey = DebugSessionHelper.getS3Key({
      workspaceId: debugSession.workspace,
      projectId: debugSession.project,
      debugSessionId: debugSession._id,
      dataType: DebugSessionDataType.OTLP_LOGS,
      fileId: s3LogsFileId.toString(),
    })

    const totalLogs = await Clickhouse.countTotal(
      logsTable,
      debugSessionDataFilter,
    )

    logger.info({
      totalLogs,
      s3LogsFileKey,
      debugSessionId: debugSession._id.toString(),
      debugSessionShortId: debugSession.shortId,
    }, '[CONTINUOUS_DEBUGGER] Moving logs to s3')

    await Clickhouse.moveDataToS3(
      `${s3Host}/${s3LogsFileKey}`,
      logsTable,
      debugSessionDataFilter,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      replace,
    )

    await DebugSessionModel.addS3File(
      debugSessionId,
      {
        _id: s3LogsFileId,
        bucket: S3_DEBUG_SESSIONS_BUCKET,
        key: s3LogsFileKey,
        dataType: DebugSessionDataType.OTLP_LOGS,
        totalCount: totalLogs,
      },
    )

    // move spans
    const spansTable = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME}`
    const s3SpansFileId = new ObjectId()
    const s3SpansFileKey = DebugSessionHelper.getS3Key({
      workspaceId: debugSession.workspace,
      projectId: debugSession.project,
      debugSessionId: debugSession._id,
      dataType: DebugSessionDataType.OTLP_TRACES,
      fileId: s3SpansFileId.toString(),
    })

    const totalSpans = await Clickhouse.countTotal(
      spansTable,
      debugSessionDataFilter,
    )

    logger.info({
      totalSpans,
      s3SpansFileKey,
      debugSessionId: debugSession._id.toString(),
      debugSessionShortId: debugSession.shortId,
    }, '[CONTINUOUS_DEBUGGER] Moving spans to s3')

    await Clickhouse.moveDataToS3(
      `${s3Host}/${s3SpansFileKey}`,
      spansTable,
      debugSessionDataFilter,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      replace,
    )

    await DebugSessionModel.addS3File(
      debugSessionId,
      {
        _id: s3SpansFileId,
        bucket: S3_DEBUG_SESSIONS_BUCKET,
        key: s3SpansFileKey,
        dataType: DebugSessionDataType.OTLP_TRACES,
        totalCount: totalSpans,
      },
    )

    // move rrweb events
    const [{ timestamp: nearestRrwebMetaTimestamp } = {}] = await Clickhouse.select(
      `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME}`,
      {
        workspaceId: debugSession.workspace.toString(),
        projectId: debugSession.project.toString(),
        debugSessionId: debugSession.continuousDebugSession,
        timestamp: {
          $gte: {
            $date: new Date(debugSession.startedAt),
          },
          $lte: {
            $date: new Date(debugSession.stoppedAt),
          },
        },
      },
      {
        skip: 0,
        limit: 1,
      },
      'timestamp',
      undefined,
      undefined,
      {
        sortKey: 'timestamp',
        sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
      },
    )

    if (nearestRrwebMetaTimestamp) {
      const _nearestRrwebMetaTimestamp = nearestRrwebMetaTimestamp
        .replace(' ', 'T')
        .replace(/(\.\d{3})\d*/, '$1') + 'Z'

      const rrwebEventsTable = `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME}`
      const s3RrwebEvensFileId = new ObjectId()
      const s3RrwebEventsFileKey = DebugSessionHelper.getS3Key({
        workspaceId: debugSession.workspace,
        projectId: debugSession.project,
        debugSessionId: debugSession._id,
        dataType: DebugSessionDataType.RRWEB_EVENTS,
        fileId: s3RrwebEvensFileId.toString(),
      })


      const debugSessionDataRrwebFilter = {
        debugSessionId: debugSession.continuousDebugSession,
        timestamp: {
          $gte: {
            $date: new Date(_nearestRrwebMetaTimestamp),
          },
          $lte: {
            $date: new Date(debugSession.stoppedAt),
          },
        },
      }

      const totalRrwebEvents = await Clickhouse.countTotal(
        rrwebEventsTable,
        debugSessionDataRrwebFilter,
      )

      logger.info({
        totalRrwebEvents,
        s3RrwebEventsFileKey,
        debugSessionId: debugSession._id.toString(),
        debugSessionShortId: debugSession.shortId,
      }, '[CONTINUOUS_DEBUGGER] Moving RRweb events to s3')

      await Clickhouse.moveDataToS3(
        `${s3Host}/${s3RrwebEventsFileKey}`,
        rrwebEventsTable,
        debugSessionDataRrwebFilter,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        replace,
      )
      await DebugSessionModel.addS3File(
        debugSessionId,
        {
          _id: s3RrwebEvensFileId,
          bucket: S3_DEBUG_SESSIONS_BUCKET,
          key: s3RrwebEventsFileKey,
          dataType: DebugSessionDataType.RRWEB_EVENTS,
          totalCount: totalRrwebEvents,
        },
      )
    }

    await DebugSessionModel.updateDebugSessionById(
      debugSession.workspace,
      debugSession.project,
      debugSession._id,
      {
        finishedS3Transfer: true,
      },
    )

    logger.info(
      {
        debugSessionId: debugSession._id.toString(),
        debugSessionShortId: debugSession.shortId,
      },
      '[CONTINUOUS_DEBUGGER] Finished moving debug session data to S3',
    )
  } catch (error) {
    logger.error(
      error,
      {
        debugSessionId: debugSession._id.toString(),
        debugSessionShortId: debugSession.shortId,
      },
      '[CONTINUOUS_DEBUGGER] Failed to move debug session data to S3',
    )
  }
}

export const listDebugSessionTraces = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
  cursor?: {
    skip: number,
    limit: number,
  },
): Promise<Readable> => {
  const debugSessionOtelTracesStream = await Clickhouse.selectStream(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME} parentSpan`,
    {
      [`SpanAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.continuousDebugSessionId,
      Timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
    cursor,
  )

  return debugSessionOtelTracesStream
}

export const getTotalDebugSessionTracesCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME} parentSpan`,
    {
      [`SpanAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.continuousDebugSessionId,
      Timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
  )
}

export const listDebugSessionLogs = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
  cursor?: {
    skip: number,
    limit: number,
  },
) => {
  const debugSessionOtelLogsStream = await Clickhouse.selectStream(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME} parentLog`,
    {
      [`LogAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`LogAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.continuousDebugSessionId,
      Timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
    cursor,
  )

  return debugSessionOtelLogsStream
}

export const getTotalDebugSessionLogsCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME} parentLog`,
    {
      [`LogAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`LogAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.continuousDebugSessionId,
      Timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
  )
}

export const listDebugSessionRrwebEvents = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
  cursor: {
    skip: number,
    limit: number,
  },
): Promise<Readable> => {
  const rrwebEventsStream = await Clickhouse.selectStream(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME}`,
    {
      workspaceId: filter.workspaceId,
      projectId: filter.projectId,
      debugSessionId: filter.continuousDebugSessionId,
      timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
    cursor,
  )

  return rrwebEventsStream
}

export const getTotalDebugSessionRrwebEventsCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    continuousDebugSessionId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME} parentSpan`,
    {
      workspaceId: filter.workspaceId,
      projectId: filter.projectId,
      debugSessionId: filter.continuousDebugSessionId,
      timestamp: {
        $gte: {
          $date: filter.fromTimestamp,
        },
        $lte: {
          $date: filter.toTimestamp,
        },
      },
    },
  )
}
