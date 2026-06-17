import * as Clickhouse from '@multiplayer/clickhouse'
import { ObjectId } from '@multiplayer/mongo'
import * as AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import { RandomToken, JwtToken } from '@multiplayer/util'
import {
  S3_EXPORT_HOST,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} from '@multiplayer/s3'
import {
  DebugSessionModel,
  IDebugSessionDocument,
  IEndUserDocument,
  IssueEndUserModel,
  IssueModel,
  ProjectModel,
} from '@multiplayer/models'
import {
  NotFoundError,
  InvalidArgumentError,
} from 'restify-errors'
import { Readable } from 'stream'
import {
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_SESSION_PREFIX,
  MULTIPLAYER_TRACE_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_CLIENT_ID_LENGTH,
  SessionType,
} from '@multiplayer-app/session-recorder-node'
import {
  OtelSpanCh,
  OtelLogCh,
  IDebugSessionRrwebEvent,
  DebugSessionDataType,
  MoveDebugSessionDataToS3Message,
  IDebugSession,
  EndUserState,
  DebugSessionCreationReasonType,
  IIssue,
  IEndUser,
  IntegrationTypeEnum,
  ObjectTypeEnum,
  IIntegrationApiKeyJwtPaylaod,
  DebugSessionAgentEvents,
  DebugSessionEvents,
} from '@multiplayer/types'
import {
  CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME,
  CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME,
  CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME,
  CLICKHOUSE_DEBUG_SESSION_DB,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME,
  CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME,
  S3_DEBUG_SESSIONS_BUCKET,
  AMQP_DEBUG_SESSION_MOVE_S3_QUEUE,
  INTEGRATION_JWT_SECRET,
  DEBUG_SESSION_MAX_DURATION_SECONDS,
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
} from '../config'
import {
  DebugSessionHelper,
  WebSocketHelper,
} from '../helpers'
import * as websocket from '../websocket'
import { OtlpLib } from '../libs'
import * as EndUserService from './end-user.service'
import {
  DebugSessionShortIdCache,
  ContinuousDebugSessionCache,
  ClientIdDebugSessionCache,
  ClientIdSocketCache,
  DebugSessionCache,
} from '../cache'

export const getDebugSessionById = async (debugSessionId: string): Promise<IDebugSession | undefined> => {
  let debugSessionObject = await DebugSessionCache.get(debugSessionId)

  if (debugSessionObject) {
    return debugSessionObject
  }

  const debugSession = await DebugSessionModel.findDebugSessionById(debugSessionId)

  if (!debugSession) {
    throw new NotFoundError('Debug-Session not found')
  }

  debugSessionObject = debugSession.toObject()

  await DebugSessionCache.set(
    debugSessionId,
    debugSessionObject,
  )

  return debugSessionObject
}

export const getDebugSessionByShortId = async (debugSessionShortId: string): Promise<IDebugSession | undefined> => {
  const debugSessionId = await getDebugSessionLongId(debugSessionShortId)

  return getDebugSessionById(debugSessionId)
}

export const getDebugSessionLongId = async (debugSessionShortId: string): Promise<string> => {
  const debugSessionId = await DebugSessionShortIdCache.get(debugSessionShortId)

  if (!debugSessionId) {
    throw new NotFoundError(`Debug-Session not found for short id ${debugSessionShortId}`)
  }

  return debugSessionId
}

export const listDebugSessionTraces = async (
  filter: {
    workspaceId: string,
    projectId: string,
    debugSessionId: string,
  },
  cursor?: {
    skip: number,
    limit: number,
  },
  stream = true,
): Promise<Readable | OtelSpanCh[]> => {
  const method = stream ? 'selectStream' : 'select'

  const debugSessionOtelTraces = await Clickhouse[method](
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME} parentSpan`,
    {
      [`SpanAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.debugSessionId,
    },
    cursor,
  )

  return debugSessionOtelTraces
}

export const getTotalDebugSessionTracesCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    debugSessionId: string,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME} parentSpan`,
    {
      [`SpanAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.debugSessionId,
    },
  )
}

export const listDebugSessionLogs = async (
  filter: {
    workspaceId: string,
    projectId: string,
    debugSessionId: string,
  },
  cursor?: {
    skip: number,
    limit: number,
  },
  stream = true,
): Promise<Readable | OtelLogCh[]> => {
  const method = stream ? 'selectStream' : 'select'

  const debugSessionOtelLogs = await Clickhouse[method](
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME} parentLog`,
    {
      [`LogAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`LogAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.debugSessionId,
    },
    cursor,
  )

  return debugSessionOtelLogs
}

export const getTotalDebugSessionLogsCount = async (
  filter: {
    workspaceId: string,
    projectId: string,
    debugSessionId: string,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME} parentLog`,
    {
      [`LogAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: filter.workspaceId,
      [`LogAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: filter.projectId,
      [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: filter.debugSessionId,
    },
  )
}

export const getDebugSessionUrl = async (debugSession: IDebugSession | IDebugSessionDocument): Promise<string> => {
  const project = await ProjectModel.findProjectById(debugSession.project)

  return `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}${project?.access?.guest?.enabled ? '/public' : ''}/project/${debugSession.workspace}/${debugSession.project}/default/debugger/session/${debugSession._id}`
}

export const createDebugSessionSpans = async (spans: OtelSpanCh[]): Promise<void> => {
  if (!spans?.length) {
    return
  }

  await Clickhouse.insert(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`,
    OtlpLib.flattenSpansForClickHouse(spans),
  )

  logger.debug(`Inserted ${spans.length} to clickhouse db: ${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`)
}

export const createDebugSessionLogs = async (logs: OtelLogCh[]): Promise<void> => {
  if (!logs?.length) {
    return
  }

  await Clickhouse.insert(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`,
    logs,
  )

  logger.debug(`Inserted ${logs.length} to clickhouse db: ${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`)
}

export const deleteLogsByDebugSessionId = async (
  debugSessionId: string,
): Promise<void> => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`,
    {
      debugSessionId: debugSessionId.toString(),
    },
  )
}

export const deleteTracesByDebugSessionId = async (
  debugSessionId: string,
): Promise<void> => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`,
    {
      debugSessionId: debugSessionId.toString(),
    },
  )
}

export const createDebugSessionRrwebEvents = async (
  events: (Partial<IDebugSessionRrwebEvent> & { type: number })[],
): Promise<IDebugSessionRrwebEvent[]> => {
  if (!events.length) {
    return []
  }

  const debugSessionId = events[0].debugSessionId

  if (!events.every(event => event.debugSessionId === debugSessionId)) {
    throw new InvalidArgumentError('All events should have same debug-session id')
  }

  if (!debugSessionId) {
    throw new InvalidArgumentError('Missing debug session id')
  }

  const debugSession = await getDebugSessionById(debugSessionId)

  if (!debugSession) {
    logger.error({
      event: DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE,
      debugSessionId,
    }, '[Websocket] Debug session not found')

    return []
  }

  logger.debug({
    event: 'debug-session:rrweb:add-event',
    debugSessionId,
  }, '[Websocket] Got event')

  const _events: Partial<IDebugSessionRrwebEvent>[] = events.map((event) => ({
    id: new ObjectId().toString(),
    workspaceId: event.workspaceId,
    projectId: event.projectId,
    debugSessionId: event.debugSessionId,
    type: event.type,
    data: event.data,
    timestamp: event.timestamp
      ? new Date(event.timestamp).toISOString()
      : new Date().toISOString(),
  }))

  const tableName = `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`

  await Clickhouse.insert(
    tableName,
    _events,
  )

  logger.debug(
    {
      debugSessionId,
    },
    `Inserted ${_events.length} rrweb events to clickhouse (${tableName})`,
  )

  return _events as IDebugSessionRrwebEvent[]
}

export const listDebugSessionRrwebEvents = async (
  filter: {
    debugSessionId: string,
  },
  cursor: {
    skip: number,
    limit: number,
  },
): Promise<Readable> => {
  const rrwebEventsStream = await Clickhouse.selectStream(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`,
    filter,
    cursor,
  )

  return rrwebEventsStream
}

export const getTotalDebugSessionRrwebEventsCount = async (
  filter: {
    debugSessionId: string,
  },
): Promise<number> => {
  return Clickhouse.countTotal(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME} parentSpan`,
    filter,
  )
}

export const deleteDebugSessionRrwebEventsById = async (
  debugSessionId: string,
) => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`,
    {
      debugSessionId,
    },
  )
}

export const moveDebugSessionDataFromChToS3 = async (
  debugSessionId: string | ObjectId,
) => {
  const debugSession = await getDebugSessionById(debugSessionId.toString())

  if (!debugSession) {
    throw new NotFoundError(`Debug session with id ${debugSessionId} not found`)
  }

  try {
    const s3Host = `${S3_EXPORT_HOST}/${S3_DEBUG_SESSIONS_BUCKET}`
    const debugSessionDataFilter = {
      debugSessionId: debugSessionId.toString(),
    }

    // move logs
    const logsTable = `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`
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
    }, 'Moving logs to s3')

    await Clickhouse.moveDataToS3(
      `${s3Host}/${s3LogsFileKey}`,
      logsTable,
      debugSessionDataFilter,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
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
    const spansTable = `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`
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
    }, 'Moving spans to s3')

    await Clickhouse.moveDataToS3(
      `${s3Host}/${s3SpansFileKey}`,
      spansTable,
      debugSessionDataFilter,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
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
    const rrwebEventsTable = `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`
    const s3RrwebEvensFileId = new ObjectId()
    const s3RrwebEventsFileKey = DebugSessionHelper.getS3Key({
      workspaceId: debugSession.workspace,
      projectId: debugSession.project,
      debugSessionId: debugSession._id,
      dataType: DebugSessionDataType.RRWEB_EVENTS,
      fileId: s3RrwebEvensFileId.toString(),
    })

    const totalRrwebEvents = await Clickhouse.countTotal(
      rrwebEventsTable,
      debugSessionDataFilter,
    )

    logger.info({
      totalRrwebEvents,
      s3RrwebEventsFileKey,
      debugSessionId: debugSession._id.toString(),
      debugSessionShortId: debugSession.shortId,
    }, 'Moving RRweb events to s3')

    await Clickhouse.moveDataToS3(
      `${s3Host}/${s3RrwebEventsFileKey}`,
      rrwebEventsTable,
      debugSessionDataFilter,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
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
      'Finished moving debug session data to S3',
    )
  } catch (error) {
    logger.error(
      error,
      {
        debugSessionId: debugSession._id.toString(),
        debugSessionShortId: debugSession.shortId,
      },
      'Failed to move debug session data to S3',
    )
  }
}

export const stopDebugSessionById = async (
  debugSessionId: string | ObjectId,
  payload: {
    sessionAttributes?: object
    stoppedAt?: Date
  } = {},
  copyDataToS3 = false,
): Promise<IDebugSessionDocument | IDebugSession | void> => {
  let debugSession: IDebugSessionDocument | IDebugSession | undefined = await getDebugSessionById(debugSessionId.toString())

  if (!debugSession) {
    throw new NotFoundError('Debug-Session not found')
  }

  if (debugSession.socketId) {
    await EndUserService.updateEndUserStateBySocketId(
      debugSession.socketId,
      {
        state: EndUserState.IDLE,
      },
    )
  }

  const debugSessionRrwebEventsTable = [
    SessionType.MANUAL,
    SessionType.SESSION_CACHE,
  ].includes(debugSession.sessionType)
    ? `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`
    : `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME}`

  const debugSessionTracesTable = [
    SessionType.MANUAL,
    SessionType.SESSION_CACHE,
  ].includes(debugSession.sessionType)
    ? `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`
    : `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME}`

  const debugSessionLogsTable = [
    SessionType.MANUAL,
    SessionType.SESSION_CACHE,
  ].includes(debugSession.sessionType)
    ? `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`
    : `${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB}.${CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME}`

  const chDataFilter = debugSession.continuousDebugSession
    ? { debugSessionId: debugSession.continuousDebugSession }
    : { debugSessionId: debugSessionId.toString() }

  if (!debugSession.stoppedAt) {
    payload.stoppedAt = payload.stoppedAt
      ? new Date(payload.stoppedAt)
      : new Date()

    const durationInSeconds = Math.max(
      0,
      (payload.stoppedAt.getTime() - new Date(debugSession.startedAt).getTime()) / 1000,
    )

    debugSession = await DebugSessionModel.stopDebugSessionById(
      debugSessionId,
      {
        sessionAttributes: payload.sessionAttributes || {},
        stoppedAt: payload.stoppedAt,
        durationInSeconds,
      },
    ) as IDebugSessionDocument
  }


  if (
    debugSession.creationReason === DebugSessionCreationReasonType.ISSUE
  ) {
    const [
      [firstOtlpSpan],
      [firstOtlpLog],
      [firstRrwebEvent],
      [lastOtlpSpan],
      [lastOtlpLog],
      [lastRrwebEvent],
    ] = await Promise.all([
      Clickhouse.select(
        debugSessionTracesTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'Timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
        },
      ),
      Clickhouse.select(
        debugSessionLogsTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'Timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
        },
      ),
      Clickhouse.select(
        debugSessionRrwebEventsTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.ASC,
        },
      ),
      Clickhouse.select(
        debugSessionTracesTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'Timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.DESC,
        },
      ),
      Clickhouse.select(
        debugSessionLogsTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'Timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.DESC,
        },
      ),
      Clickhouse.select(
        debugSessionRrwebEventsTable,
        chDataFilter,
        {
          skip: 0,
          limit: 1,
        },
        undefined,
        undefined,
        undefined,
        {
          sortKey: 'timestamp',
          sortDirection: Clickhouse.ClickHouseTypes.ClickHouseSortOrder.DESC,
        },
      ),
    ])

    const startedAtDates = [
      firstOtlpSpan?.Timestamp,
      firstOtlpLog?.Timestamp,
      firstRrwebEvent?.timestamp,
    ]
      .filter(Boolean)
      .map(timestamp => new Date(timestamp.replace(' ', 'T') + 'Z'))
      .map(date => date.getTime())

    const stoppedAtDates = [
      lastOtlpSpan?.Timestamp,
      lastOtlpLog?.Timestamp,
      lastRrwebEvent?.timestamp,
    ]
      .filter(Boolean)
      .map(timestamp => new Date(timestamp.replace(' ', 'T') + 'Z'))
      .map(date => date.getTime())

    if (startedAtDates.length > 0 && stoppedAtDates.length > 0) {
      debugSession.startedAt = new Date(Math.min(...startedAtDates)).toISOString()
      debugSession.stoppedAt = new Date(Math.max(...stoppedAtDates)).toISOString()
      debugSession.durationInSeconds = Math.max(
        0,
        (new Date(debugSession.stoppedAt).getTime() - new Date(debugSession.startedAt).getTime()) / 1000,
      )

      await DebugSessionModel.updateDebugSessionById(
        debugSession.workspace,
        debugSession.project,
        debugSession._id,
        {
          startedAt: debugSession.startedAt,
          stoppedAt: debugSession.stoppedAt,
          durationInSeconds: debugSession.durationInSeconds,
        },
      )
    } else {
      await DebugSessionModel.deleteDebugSessionById(debugSessionId)
      logger.warn({
        debugSessionId: debugSession._id.toString(),
        debugSessionShortId: debugSession.shortId,
      }, 'Debug session was deleted because it has no data')
      return
    }
  }



  const [
    totalLogs,
    totalSpans,
    totalRrwebEvents,
  ] = await Promise.all([
    Clickhouse.countTotal(
      debugSessionLogsTable,
      chDataFilter,
    ),
    Clickhouse.countTotal(
      debugSessionTracesTable,
      chDataFilter,
    ),
    Clickhouse.countTotal(
      debugSessionRrwebEventsTable,
      chDataFilter,
    ),
  ])

  logger.info({
    debugSessionShortId: debugSession.shortId,
    continuousDebugSession: !!debugSession.continuousDebugSession,
    debugSessionId,
    copyDataToS3,
    totalLogs,
    totalSpans,
    totalRrwebEvents,
  }, '[DEBUG-SESSION] Debug session was stopped')

  const _debugSessionUrl = await getDebugSessionUrl(debugSession)

  const _debugSession = {
    ...((debugSession as any)?.toObject?.() || debugSession),
    url: _debugSessionUrl,
  }

  websocket.debugSessionNamespaceHandler.emitMessageToRoom(
    debugSession.workspace,
    debugSession.project,
    WebSocketHelper.getSessionRecordingRoomInProject(
      debugSession.workspace,
      debugSession.project,
    ),
    DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
    {
      data: _debugSession,
    },
  )

  websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
    WebSocketHelper.getSessionRecordingRoomById(debugSession._id.toString()),
    DebugSessionAgentEvents.DEBUG_SESSION_STOPPED,
    {
      data: _debugSession,
    },
  )

  if (copyDataToS3) {
    await AMQP.publish(
      AMQP_DEBUG_SESSION_MOVE_S3_QUEUE,
      {
        variables: {
          debugSessionId: debugSession._id.toString(),
        } as MoveDebugSessionDataToS3Message,
      },
    )

    logger.info({
      debugSessionShortId: debugSession.shortId,
      debugSessionId,
    }, '[DEBUG-SESSION] Added task for moving data to s3')
  }

  return debugSession
}

export const bulkDeleteLogsByDebugSessionId = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionIds?: string[] | ObjectId[],
): Promise<void> => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`,
    {
      [`LogAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: workspaceId,
      [`LogAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: projectId,
      ...debugSessionIds?.length
        ? {
          [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: debugSessionIds,
        }
        : {},
    },
  )
}

export const bulkDeleteTracesByDebugSessionId = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionIds?: string[] | ObjectId[],
): Promise<void> => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`,
    {
      [`SpanAttributes['${ATTR_MULTIPLAYER_WORKSPACE_ID}']`]: workspaceId,
      [`SpanAttributes['${ATTR_MULTIPLAYER_PROJECT_ID}']`]: projectId,
      ...debugSessionIds?.length
        ? {
          [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: debugSessionIds,
        }
        : {},
    },
  )
}

export const bulkDeleteRrwebEventsDebugSessionById = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionIds?: string[] | ObjectId[],
) => {
  await Clickhouse.remove(
    `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`,
    {
      workspaceId,
      projectId,
      ...debugSessionIds?.length
        ? {
          debugSessionId: debugSessionIds,
        }
        : {},
    },
  )
}

export const updateDebugSessionBySocketId = async (
  socketId: string | ObjectId,
  payload: Partial<IDebugSession>,
): Promise<void> => {
  await DebugSessionModel.updateDebugSessionBySocketId(
    socketId,
    payload,
  )
}

export const removeSocketIdFromDebugSession = async (
  socketId: string | ObjectId,
): Promise<void> => {
  await DebugSessionModel.removeSocketIdFromDebugSession(socketId)
}

export const addSocketIdToDebugSession = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  socketId: string,
  debugSessionId: string,
): Promise<IDebugSessionDocument | IDebugSession | { continuousDebugSession: boolean } | undefined> => {
  if (!ObjectId.isValid(debugSessionId)) {
    const continuousDebugSession = await ContinuousDebugSessionCache.get(debugSessionId as string)

    if (continuousDebugSession) {
      return {
        continuousDebugSession: true,
      }
    }

    const _debugSessionId = await DebugSessionShortIdCache.get(debugSessionId as string)

    if (!_debugSessionId) {
      throw new NotFoundError('Debug-Session not found')
    }

    debugSessionId = _debugSessionId
  }

  const debugSession = await DebugSessionModel.updateDebugSessionById(
    workspaceId,
    projectId,
    debugSessionId,
    {
      socketId,
    },
  )

  return debugSession
}

export const createDebugSessionForIssue = async (
  issue: IIssue,
  span: OtelSpanCh,
  clientId?: string,
): Promise<{
  debugSession: IDebugSession,
  endUser?: IEndUser,
  socketId?: string,
}> => {
  let endUser: IEndUser | undefined
  let socketId: string | undefined

  const workspaceId = issue.workspace.toString()
  const projectId = issue.project.toString()
  const debugSessionShortId = await RandomToken.generateRandomToken(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH)

  if (clientId) {
    const debugSessionId = await ClientIdDebugSessionCache.get(
      workspaceId,
      projectId,
      clientId,
    )
    socketId = await ClientIdSocketCache.get(clientId)

    endUser = await EndUserService.findEndUserByClientId(clientId)

    if (!socketId) {
      socketId = endUser?.connections
        .find(connection => connection.clientId === clientId)?.socketId

      if (socketId) {
        await ClientIdSocketCache.set(
          clientId,
          socketId,
        )
      }
    }

    if (debugSessionId) {
      const debugSession = await DebugSessionCache.get(debugSessionId)

      if (debugSession) {
        return {
          debugSession,
          endUser,
          socketId,
        }
      }
    }
  }

  const sessionType = OtlpLib.getSessionTypeFromTraceId(span.TraceId)

  if (!sessionType) {
    logger.error({
      traceId: span.TraceId,
    }, '[DEBUG-SESSION] Failed to determine session type from trace id')
    throw new InvalidArgumentError('Invalid session type')
  }

  const debugSession = await DebugSessionModel.createDebugSession({
    workspace: workspaceId,
    project: projectId,
    name: `${issue?.metadata?.type ? `${issue?.metadata.type}: ` : ''}${issue.title}`,
    clientId,
    shortId: debugSessionShortId,
    sessionType: sessionType,
    creationReason: DebugSessionCreationReasonType.ISSUE,
    startedAt: new Date(),
    stoppedAt: new Date(),
    endUserHash: endUser?.hash,
    userAttributes: endUser?.attributes,
    issues: [{
      issueHash: issue.hash,
      issueTitleHash: issue.titleHash,
      issueComponentHash: issue.componentHash,
      issueCustomHash: issue.customHash,
      traceId: span.TraceId,
      spanId: span.SpanId,
    }],
  })

  await Promise.all([
    ...(clientId ? [ClientIdDebugSessionCache.set(
      workspaceId,
      projectId,
      clientId,
      debugSession._id.toString(),
    )] : []),
    DebugSessionCache.set(
      debugSession._id.toString(),
      debugSession.toObject(),
    ),
    DebugSessionShortIdCache.set(
      debugSession.shortId,
      debugSession._id.toString(),
      40,
    ),
  ])

  const _debugSessionUrl = await getDebugSessionUrl(debugSession)

  const _debugSession = {
    ...debugSession.toObject(),
    url: _debugSessionUrl,
  }

  websocket.debugSessionNamespaceHandler.emitMessageToRoom(
    debugSession.workspace,
    debugSession.project,
    WebSocketHelper.getSessionRecordingRoomInProject(
      issue.workspace.toString(),
      issue.project.toString(),
    ),
    DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
    {
      data: _debugSession,
    },
  )

  websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
    WebSocketHelper.getSessionRecordingRoomById(
      debugSession._id.toString(),
    ),
    DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED,
    {
      data: _debugSession,
    },
  )

  if (socketId && endUser) {
    websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
      WebSocketHelper.getEndUserSocketRoomInProject(
        issue.workspace.toString(),
        issue.project.toString(),
        endUser._id.toString(),
        socketId,
      ),
      DebugSessionAgentEvents.DEBUG_SESSION_SAVE_BUFFER_EVENT,
      {
        debugSession: {
          _id: debugSession._id.toString(),
          url: _debugSessionUrl,
        },
      },
    )
  }

  return {
    debugSession: _debugSession,
    endUser,
    socketId,
  }
}

export const createManualDebugSession = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  payload: Partial<IDebugSession> & {
    metadata?: object,
    clientMetadata?: object,
    userMetadata?: object,
  },
): Promise<IDebugSession> => {
  const {
    name = '',
    sessionAttributes,
    resourceAttributes,
    userAttributes,
    tags,

    // backwards compatibility
    metadata,
    clientMetadata,
    userMetadata,
  } = payload

  let endUser: IEndUserDocument | null = null
  if (userAttributes) {
    endUser = await EndUserService.createEndUser({
      workspace: workspaceId.toString(),
      project: projectId.toString(),
      attributes: userAttributes,
    })
  }

  const shortId = await RandomToken.generateRandomToken(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH)

  const debugSession = await DebugSessionModel.createDebugSession({
    sessionType: SessionType.MANUAL,
    creationReason: DebugSessionCreationReasonType.MANUAL,
    shortId,
    workspace: workspaceId.toString(),
    project: projectId.toString(),
    name,
    tags,
    startedAt: new Date(),
    sessionAttributes: sessionAttributes || { ...(metadata || {}), ...(userMetadata || {}) } || {},
    resourceAttributes: resourceAttributes || clientMetadata || {},
    userAttributes,
    ...endUser ? { endUserHash: endUser.hash } : {},
  })

  await Promise.all([
    DebugSessionShortIdCache.set(
      debugSession.shortId,
      debugSession._id.toString(),
    ),
    DebugSessionCache.set(
      debugSession._id.toString(),
      debugSession.toObject(),
    ),
  ])

  // temp token used in chrome extension
  const tempJwtKeyPayload: IIntegrationApiKeyJwtPaylaod = {
    workspace: workspaceId.toString(),
    project: projectId.toString(),
    type: IntegrationTypeEnum.OTEL,
    temporary: true,
    objectType: ObjectTypeEnum.DEBUG_SESSION,
    objectId: debugSession._id.toString(),
  }

  const tempJwtToken = JwtToken.generateJwtToken(
    tempJwtKeyPayload,
    INTEGRATION_JWT_SECRET,
    {
      expiresIn: DEBUG_SESSION_MAX_DURATION_SECONDS + 60,
    },
  )

  websocket.debugSessionNamespaceHandler.emitMessageToRoom(
    workspaceId.toString(),
    projectId.toString(),
    WebSocketHelper.getSessionRecordingRoomInProject(
      workspaceId.toString(),
      projectId.toString(),
    ),
    DebugSessionAgentEvents.DEBUG_SESSION_STARTED,
    {
      data: debugSession,
    },
  )

  const _debugSessionUrl = await getDebugSessionUrl(debugSession)

  const debugSessionObject = debugSession.toObject()

  return {
    ...debugSessionObject,
    tempApiKey: tempJwtToken,
    url: _debugSessionUrl,
  }
}

/**
 *
 * @param workspaceId
 * @param projectId
 * @param debugSessionId - debug session id or short id
 * @param payload
 */
export const updateDebugSession = async (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionId: string | ObjectId,
  payload: Partial<IDebugSession>,
): Promise<IDebugSessionDocument | IDebugSession | undefined> => {
  const {
    name,
    tags,
    sessionAttributes,
    resourceAttributes,
    userAttributes,
    startedAt,
    stoppedAt,
  } = payload

  let endUser: IEndUserDocument | undefined = undefined
  if (userAttributes) {
    endUser = await EndUserService.createEndUser({
      workspace: workspaceId.toString(),
      project: projectId.toString(),
      attributes: userAttributes,
    })

    await EndUserService.incrementSessionRecordingsCount({ hash: endUser.hash })
  }

  if (
    typeof debugSessionId === 'string'
    && debugSessionId?.length === MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH
  ) {
    const _debugSessionId = await DebugSessionShortIdCache.get(debugSessionId as string)

    if (!_debugSessionId) {
      throw new NotFoundError('Debug-Session not found')
    }

    debugSessionId = _debugSessionId
  }

  const oldDebugSession = await getDebugSessionById(debugSessionId.toString())

  if (!oldDebugSession) {
    throw new NotFoundError('Debug-Session not found')
  }

  const _sessionAttributes = {
    ...(sessionAttributes || {}),
    ...JSON.parse(JSON.stringify(oldDebugSession.sessionAttributes || {})),
  }

  let durationInSeconds

  if (startedAt && stoppedAt) {
    durationInSeconds = (
      new Date(stoppedAt).getTime()
      - new Date(startedAt).getTime()
    ) / 1000
  }

  const debugSession = await DebugSessionModel.updateDebugSessionById(
    workspaceId,
    projectId,
    debugSessionId as string,
    {
      ...name ? { name } : {},
      ...tags ? { tags } : {},
      ...sessionAttributes ? { sessionAttributes: _sessionAttributes } : {},
      ...resourceAttributes ? { resourceAttributes } : {},
      ...userAttributes ? { userAttributes } : {},
      ...endUser ? { endUserHash: endUser.hash } : {},
      ...durationInSeconds ? { durationInSeconds } : {},
      ...startedAt && stoppedAt ? { startedAt, stoppedAt } : {},
    },
  )

  if (debugSession) {
    await DebugSessionCache.set(
      debugSession._id.toString(),
      debugSession.toObject(),
    )
  }

  if (
    endUser
    && debugSession
  ) {
    if ((debugSession?.issues?.length || 0) > 0) {
      const issueHash = debugSession.issues?.[0]?.issueHash

      if (issueHash) {
        const issue = await IssueModel.findIssueByHash(issueHash)

        if (issue) {
          await IssueEndUserModel.createIssueEndUser({
            workspace: workspaceId.toString(),
            project: projectId.toString(),
            issue: issue.toObject(),
            endUser: endUser.toObject(),
          })
        }
      }
    }
  }

  websocket.debugSessionNamespaceHandler.emitMessageToRoom(
    workspaceId.toString(),
    projectId.toString(),
    WebSocketHelper.getSessionRecordingRoomInProject(
      workspaceId.toString(),
      projectId.toString(),
    ),
    DebugSessionEvents.DEBUG_SESSION_UPDATED,
    {
      data: debugSession,
    },
  )

  return debugSession
}

export const getDebugSessionIdFromTraceId = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
): Promise<string | false> => {
  if (traceId.startsWith(MULTIPLAYER_TRACE_DEBUG_PREFIX)) {
    const shortDebugSessionId = traceId.substring(
      MULTIPLAYER_TRACE_DEBUG_PREFIX.length,
      MULTIPLAYER_TRACE_DEBUG_PREFIX.length + MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
    )

    return getDebugSessionLongId(shortDebugSessionId)
  }

  if (
    !traceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)
    && !traceId.startsWith(MULTIPLAYER_TRACE_SESSION_PREFIX)
  ) {
    return false
  }

  const clientId = traceId.substring(
    MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length,
    MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX.length + MULTIPLAYER_TRACE_CLIENT_ID_LENGTH * 2,
  )

  const debugSessionId = await ClientIdDebugSessionCache.get(
    workspaceId,
    projectId,
    clientId,
  )

  if (!debugSessionId) {
    return false
  }

  return debugSessionId
}

export const getDebugSessionFromTraceId = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
): Promise<IDebugSession | undefined> => {
  const debugSessionId = await getDebugSessionIdFromTraceId(
    workspaceId,
    projectId,
    traceId,
  )

  if (!debugSessionId) {
    return undefined
  }

  return getDebugSessionById(debugSessionId)
}


export const startRemoteRecordingSession = (
  workspaceId: string,
  projectId: string,
  endUserId: string,
  socketId: string,
  payload: any,
) => {
  websocket.endUserNamespaceHandler.emitMessageToRoom(
    workspaceId.toString(),
    projectId.toString(),
    WebSocketHelper.getEndUserSocketRoomInProject(
      workspaceId,
      projectId,
      endUserId,
      socketId,
    ),
    DebugSessionAgentEvents.REMOTE_SESSION_RECORDING_START,
    payload,
  )
}

export const stopRemoteRecordingSession = (
  workspaceId: string,
  projectId: string,
  endUserId: string,
  socketId: string,
  payload: any,
) => {
  websocket.debugSessionAgentNamespaceHandler.emitMessageToRoom(
    WebSocketHelper.getEndUserSocketRoomInProject(
      workspaceId,
      projectId,
      endUserId,
      socketId,
    ),
    DebugSessionAgentEvents.REMOTE_SESSION_RECORDING_STOP,
    payload,
  )
}
