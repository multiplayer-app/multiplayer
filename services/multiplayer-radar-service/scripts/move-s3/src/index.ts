import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import { DebugSessionModel } from '@multiplayer/models'
import * as Clickhouse from '@multiplayer/clickhouse'
import { ObjectId } from '@multiplayer/mongo'
import logger from '@multiplayer/logger'
import {
  ATTR_MULTIPLAYER_SESSION_ID,
} from '@multiplayer-app/session-recorder-node'
import {
  DebugSessionDataType,
} from '@multiplayer/types'
import {
  S3_EXPORT_HOST,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} from '@multiplayer/s3'

export const CLICKHOUSE_DEBUG_SESSION_DB = process.env.CLICKHOUSE_DEBUG_SESSION_DB || 'debug_session'
export const CLICKHOUSE_OTEL_DB = process.env.CLICKHOUSE_OTEL_DB || 'otel'

export const CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME || 'rrweb_events'
export const CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME || 'otel_traces'
export const CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME || 'otel_logs'
export const S3_DEBUG_SESSIONS_BUCKET = process.env.S3_DEBUG_SESSIONS_BUCKET as string


export const getS3ProjectDebugSessionFolder = ({
  workspaceId,
  projectId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
}): string => {
  return `workspaces/${workspaceId}/projects/${projectId}`
}

export const getS3DebugSessionFolder = ({
  workspaceId,
  projectId,
  debugSessionId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionId: string | ObjectId,
}): string => {
  const debugSessionProjectFolder = getS3ProjectDebugSessionFolder({ workspaceId, projectId })
  return `${debugSessionProjectFolder}/debug-sessions/${debugSessionId}`
}

export const getS3Key = ({
  workspaceId,
  projectId,
  debugSessionId,
  dataType,
  fileId,
}: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  debugSessionId: string | ObjectId,
  fileId: string,
  dataType: DebugSessionDataType,
}): string => {
  const debugSessionS3Folder = getS3DebugSessionFolder({
    workspaceId,
    projectId,
    debugSessionId,
  })

  return `${debugSessionS3Folder}/${dataType}/${fileId}`
}



const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()
    await Clickhouse.connect()

    const total = await DebugSessionModel.countDocuments({
      finishedS3Transfer: { $ne: true },
    })

    let i = 0

    for await (const debugSession of DebugSessionModel.find({
      finishedS3Transfer: { $ne: true },
    }).cursor()) {
      try {
        i++

        const s3Host = `${S3_EXPORT_HOST}/${S3_DEBUG_SESSIONS_BUCKET}`

        // move logs
        const logsTable = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME}`
        const s3LogsFileId = new ObjectId()
        const s3LogsFileKey = getS3Key({
          workspaceId: debugSession.workspace,
          projectId: debugSession.project,
          debugSessionId: debugSession._id,
          dataType: DebugSessionDataType.OTLP_LOGS,
          fileId: s3LogsFileId.toString(),
        })

        await Clickhouse.moveDataToS3(
          `${s3Host}/${s3LogsFileKey}`,
          logsTable,
          {
            [`LogAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: debugSession._id.toString(),
            // debugSessionId: debugSession._id.toString(),
          },
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
        )

        await DebugSessionModel.addS3File(
          debugSession._id.toString(),
          {
            _id: s3LogsFileId,
            bucket: S3_DEBUG_SESSIONS_BUCKET,
            key: s3LogsFileKey,
            dataType: DebugSessionDataType.OTLP_LOGS,
            totalCount: 0,
          },
        )

        // move spans
        const spansTable = `${CLICKHOUSE_OTEL_DB}.${CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME}`
        const s3SpansFileId = new ObjectId()
        const s3SpansFileKey = getS3Key({
          workspaceId: debugSession.workspace,
          projectId: debugSession.project,
          debugSessionId: debugSession._id,
          dataType: DebugSessionDataType.OTLP_TRACES,
          fileId: s3SpansFileId.toString(),
        })

        await Clickhouse.moveDataToS3(
          `${s3Host}/${s3SpansFileKey}`,
          spansTable,
          {
            // debugSessionId: debugSession._id.toString(),
            [`SpanAttributes['${ATTR_MULTIPLAYER_SESSION_ID}']`]: debugSession._id.toString(),
          },
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
        )

        await DebugSessionModel.addS3File(
          debugSession._id.toString(),
          {
            _id: s3SpansFileId,
            bucket: S3_DEBUG_SESSIONS_BUCKET,
            key: s3SpansFileKey,
            dataType: DebugSessionDataType.OTLP_TRACES,
            totalCount: 0,
          },
        )

        // move rrweb events
        const rrwebEventsTable = `${CLICKHOUSE_DEBUG_SESSION_DB}.${CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME}`
        const s3RrwebEvensFileId = new ObjectId()
        const s3RrwebEventsFileKey = getS3Key({
          workspaceId: debugSession.workspace,
          projectId: debugSession.project,
          debugSessionId: debugSession._id,
          dataType: DebugSessionDataType.RRWEB_EVENTS,
          fileId: s3RrwebEvensFileId.toString(),
        })





        const rrwebEventsConditions = Clickhouse.ClickhouseQueryBuilder.buildFilter({
          debugSessionId: debugSession._id.toString(),
        })

        const query = `
        INSERT INTO FUNCTION
          s3(
            '${s3Host}/${s3RrwebEventsFileKey}',
            ${AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? `'${AWS_ACCESS_KEY_ID}', '${AWS_SECRET_ACCESS_KEY}',` : ''}
            'JSONEachRow'
          )
        SELECT
          id,
          workspaceId,
          projectId,
          debugSessionId,
          type,
          data,
          toDateTime64(timestamp / 1e9, 9)
        FROM ${rrwebEventsTable}
        WHERE ${rrwebEventsConditions}
        SETTINGS output_format_json_array_of_rows = 1;
        `
        await Clickhouse.client.command({
          query,
        })

        // await Clickhouse.client.moveDataToS3(
        //   `${s3Host}/${s3RrwebEventsFileKey}`,
        //   rrwebEventsTable,
        //   {
        //     debugSessionId: debugSession._id.toString(),
        //   },
        //   AWS_ACCESS_KEY_ID,
        //   AWS_SECRET_ACCESS_KEY,
        // )
        await DebugSessionModel.addS3File(
          debugSession._id.toString(),
          {
            _id: s3RrwebEvensFileId,
            bucket: S3_DEBUG_SESSIONS_BUCKET,
            key: s3RrwebEventsFileKey,
            dataType: DebugSessionDataType.RRWEB_EVENTS,
            totalCount: 0,
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
          },
          `Finished moving debug session data to S3 ${i}/${total}`,
        )
      } catch (e) {
        // eslint-disable-next-line
        console.error(e)
        logger.error(
          {
            e,
            debugSessionId: debugSession._id.toString(),
          },
          `Failed moving debug session data to S3 ${i}/${total}`,
        )
      }
    }
  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()

    process.exit(Number(exitWithError))
  }
}

main()
