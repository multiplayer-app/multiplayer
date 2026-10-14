import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  RadarDetectionModel,
  RadarDetectionParamModel,
} from '@multiplayer/models'
import { RadarDetectionSource } from '@multiplayer/types'
import logger from '@multiplayer/logger'
// Imported from the compiled service output (like the workspace packages above),
// not '../../../src/store' - this script's tsconfig has rootDir: './src/' and can't
// reach outside it into the parent service's sources. Requires the radar-service to
// be built (`npm run build`) before this script runs.
import { Store } from '../../../dist/store'

// These table names are no longer part of src/config.ts - nothing in the live service
// reads from the `radar` database anymore (detections/detection_params/flows all live
// in MongoDB), so the constants were removed there. This script still needs its own
// copies to read the old ClickHouse/DuckDB tables as a one-time migration source -
// same pattern as scripts/trigger-ch-seed and scripts/copy-template-project.
const CLICKHOUSE_RADAR_DB = process.env.CLICKHOUSE_RADAR_DB || 'radar'
const CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME || 'detections'
const CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME || 'detection_params'

const DETECTIONS_TABLE = `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME}`
const DETECTION_PARAMS_TABLE = `${CLICKHOUSE_RADAR_DB}.${CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME}`

// One-time seed of existing analytics-store data into the new unified Mongo model
// (see radar-detection.model.ts). Every row here is already a single, fully-formed
// snapshot from the old backend (ClickHouse's Sign-summed read / DuckDB's additive
// upsert) - RADAR-sign rows get upsertRadarObservation, DOCS-sign rows get
// upsertDocumentation, and SYNCED-sign rows (both sources already agreed on this id)
// get both, converging to the same SYNCED state. Source tables are left untouched -
// ClickHouse/DuckDB keep serving OTLP spans/logs/rrweb events exactly as before.
const migrateDetections = async (): Promise<void> => {
  const rows = await Store.select(DETECTIONS_TABLE, {}) as any[]

  if (!rows.length) {
    logger.info('No detections found in the analytics store')
    return
  }

  const radarRows: any[] = []
  const docsRows: any[] = []

  for (const { Sign, ...detection } of rows) {
    if (Sign !== RadarDetectionSource.DOCS) {
      radarRows.push(detection)
    }
    if (Sign !== RadarDetectionSource.RADAR) {
      const { platformIds, environmentNames, ...docFields } = detection
      docsRows.push(docFields)
    }
  }

  await Promise.all([
    RadarDetectionModel.upsertRadarObservation(radarRows),
    RadarDetectionModel.upsertDocumentation(docsRows),
  ])

  logger.info(`Migrated ${rows.length} detections to mongo (${radarRows.length} radar-observed, ${docsRows.length} documented)`)
}

const migrateDetectionParams = async (): Promise<void> => {
  const rows = await Store.select(DETECTION_PARAMS_TABLE, {}) as any[]

  if (!rows.length) {
    logger.info('No detection params found in the analytics store')
    return
  }

  const radarRows: any[] = []
  const docsRows: any[] = []

  for (const { Sign, ...param } of rows) {
    if (Sign !== RadarDetectionSource.DOCS) {
      radarRows.push(param)
    }
    if (Sign !== RadarDetectionSource.RADAR) {
      docsRows.push(param)
    }
  }

  await Promise.all([
    RadarDetectionParamModel.upsertRadarObservation(radarRows),
    RadarDetectionParamModel.upsertDocumentation(docsRows),
  ])

  logger.info(`Migrated ${rows.length} detection params to mongo (${radarRows.length} radar-observed, ${docsRows.length} documented)`)
}

const main = async () => {
  let exitWithError = false

  try {
    await mongo.connect()
    await Store.connect()

    await migrateDetections()
    await migrateDetectionParams()
  } catch (err) {
    exitWithError = true
    logger.error(err, 'Failed to migrate detections to mongo')
  } finally {
    await mongo.disconnect()
    process.exit(Number(exitWithError))
  }
}

main()
