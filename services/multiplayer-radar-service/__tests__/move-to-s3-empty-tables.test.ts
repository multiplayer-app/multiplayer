// Two related DuckDB export bugs, both verified against the real engine:
// 1. A COPY of zero matching rows completes without throwing but writes no S3 object
//    at all (`mc stat` on the key afterwards reports "Object does not exist").
//    moveDebugSessionDataFromChToS3 recorded an addS3File entry for every table
//    regardless of row count, so an empty table left a DB reference to a key nothing
//    ever wrote - the next presigned GET for it 404s with NoSuchKey. Fixed by
//    uploading a literal '[]' directly (bypassing Store.moveDataToS3) when count is 0.
// 2. FORMAT JSON without ARRAY true writes newline-delimited bare objects, not a JSON
//    array - inconsistent with the empty case's literal '[]' and with what a
//    JSON.parse()-ing consumer expects. Fixed by always passing ARRAY true.
import mongo, { ObjectId } from '@multiplayer/mongo'
import { DebugSessionModel } from '@multiplayer/models'
import { s3 as S3Lib } from '@multiplayer/s3'
import { DebugSessionDataType, OtelSpanCh } from '@multiplayer/types'
import { SessionType } from '@multiplayer-app/session-recorder-node'
import { duckdbStore } from '../src/store/duckdb/duckdb.store'
import * as DebugSessionService from '../src/services/debug-session.service'

const WORKSPACE_ID = new ObjectId()
const PROJECT_ID = new ObjectId()

const buildSpan = (debugSessionId: string): OtelSpanCh => ({
  id: `span-${debugSessionId}`,
  debugSessionId,
  Timestamp: new Date().toISOString(),
  TraceId: 'trace-1',
  SpanId: 'span-1',
  SpanName: 'test-span',
  SpanKind: 1,
  ServiceName: 'test-service',
  ResourceAttributes: {},
  SpanAttributes: {},
  Duration: 100,
  Events: [],
  Links: [],
} as OtelSpanCh)

beforeAll(async () => {
  await mongo.connect()
  await duckdbStore.connect()
})

afterAll(async () => {
  await DebugSessionModel.deleteMany({ workspace: WORKSPACE_ID })
  await duckdbStore.disconnect()
  await mongo.disconnect()
})

describe('moveDebugSessionDataFromChToS3: tables with zero rows still get a real, readable S3 object', () => {
  it('records an s3File for every data type, and an empty table\'s object reads back as []', async () => {
    const debugSession = await DebugSessionModel.createDebugSession({
      sessionType: SessionType.MANUAL,
      workspace: WORKSPACE_ID,
      project: PROJECT_ID,
      startedAt: new Date(),
      stoppedAt: new Date(),
    })

    // Only spans get real data - logs and rrweb events stay empty for this session.
    await DebugSessionService.createDebugSessionSpans([buildSpan(debugSession._id.toString())])

    await DebugSessionService.moveDebugSessionDataFromChToS3(debugSession._id.toString())

    const refreshed = await DebugSessionModel.findDebugSessionById(debugSession._id)
    const s3Files = refreshed?.s3Files || []
    const dataTypes = s3Files.map(f => f.dataType)

    expect(dataTypes.sort()).toEqual([
      DebugSessionDataType.OTLP_LOGS,
      DebugSessionDataType.OTLP_TRACES,
      DebugSessionDataType.RRWEB_EVENTS,
    ].sort())

    const logsFile = s3Files.find(f => f.dataType === DebugSessionDataType.OTLP_LOGS)
    expect(logsFile?.totalCount).toBe(0)

    const logsContent = await S3Lib.downloadFileAsString(logsFile!.key, logsFile!.bucket)
    expect(logsContent).toBe('[]')

    const spansFile = s3Files.find(f => f.dataType === DebugSessionDataType.OTLP_TRACES)
    expect(spansFile?.totalCount).toBe(1)

    const spansContent = await S3Lib.downloadFileAsString(spansFile!.key, spansFile!.bucket)
    expect(spansContent?.trim().startsWith('[')).toBe(true)
    expect(spansContent?.trim().endsWith(']')).toBe(true)
    expect(JSON.parse(spansContent!)).toHaveLength(1)
  })
})
