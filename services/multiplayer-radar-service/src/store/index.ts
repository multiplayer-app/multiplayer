import { ANALYTICS_DB_ENGINE } from '../config'
import { clickhouseStore } from './clickhouse/clickhouse.store'
import { duckdbStore } from './duckdb/duckdb.store'
import type { IAnalyticsStore } from './types'

const getStore = (): IAnalyticsStore => {
  switch (ANALYTICS_DB_ENGINE) {
    case 'clickhouse':
      return clickhouseStore
    case 'duckdb':
      return duckdbStore
    default:
      throw new Error(`Unknown ANALYTICS_DB_ENGINE: ${ANALYTICS_DB_ENGINE}`)
  }
}

export const Store: IAnalyticsStore = getStore()

export * from './types'
