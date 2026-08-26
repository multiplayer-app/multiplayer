import { ANALYTICS_DB_ENGINE } from '../config'
import { clickhouseStore } from './clickhouse/clickhouse.store'
import { duckdbStore } from './duckdb/duckdb.store'
import { getState, isLeader } from './leader-election'
import { remoteStore } from './remote/remote.store'
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

// The engine-selected backend, always local to this replica. The leader-side RPC
// handler (./leader-listener.ts) dispatches to this directly - never to the facade
// below - which structurally rules out a forward loop.
export const localStore: IAnalyticsStore = getStore()

// DuckDB is a single-writer embedded file, so with multiple replicas exactly one (the
// Redis-elected leader, see ./leader-election.ts) owns all local I/O and everyone else
// forwards over the leader's internal store API. Dispatch happens per call - leadership
// can change between calls. When election was never started ('idle': tests, ClickHouse
// engine, single-replica dev before redis connects) every call stays local, preserving
// pre-feature behavior exactly.
//
// A plain object with real named methods (not a Proxy) because callers use dynamic
// dispatch - e.g. `Store[method]` in debug-session.service.ts.
const createLeaderFacade = (local: IAnalyticsStore): IAnalyticsStore => {
  const actLocally = () => isLeader() || getState() === 'idle'

  return {
    connect: () => local.connect(),
    disconnect: () => local.disconnect(),
    connected: () => local.connected(),

    select: (...args: Parameters<IAnalyticsStore['select']>) =>
      (actLocally() ? local : remoteStore).select(...args),
    selectStream: (...args: Parameters<IAnalyticsStore['selectStream']>) =>
      (actLocally() ? local : remoteStore).selectStream(...args),
    countTotal: (...args: Parameters<IAnalyticsStore['countTotal']>) =>
      (actLocally() ? local : remoteStore).countTotal(...args),
    insert: (...args: Parameters<IAnalyticsStore['insert']>) =>
      (actLocally() ? local : remoteStore).insert(...args),
    remove: (...args: Parameters<IAnalyticsStore['remove']>) =>
      (actLocally() ? local : remoteStore).remove(...args),
    moveDataToS3: (...args: Parameters<IAnalyticsStore['moveDataToS3']>) =>
      (actLocally() ? local : remoteStore).moveDataToS3(...args),
  }
}

export const Store: IAnalyticsStore = ANALYTICS_DB_ENGINE === 'duckdb'
  ? createLeaderFacade(localStore)
  : localStore

export * from './types'
