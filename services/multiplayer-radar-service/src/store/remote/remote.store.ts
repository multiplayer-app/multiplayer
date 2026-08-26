import { Readable } from 'stream'
import AMQP from '@multiplayer/amqp'
import {
  AMQP_STORE_RPC_QUEUE,
  STORE_FORWARD_S3_MOVE_TIMEOUT_MS,
  STORE_FORWARD_TIMEOUT_MS,
} from '../../config'
import type {
  FilterQuery,
  ICursorOptions,
  ISortOptions,
} from '../types'
import { refreshNow, waitForLeader } from '../leader-election'
import type { StoreRpcOp } from './types'

// Follower-side client for the leader's store RPC (src/store/leader-listener.ts).
// Implements the six data methods of IAnalyticsStore - connect/disconnect/connected
// stay local on every replica and never go through here. Routing is entirely by AMQP
// queue name (AMQP.request's reply rides RabbitMQ's built-in direct-reply-to feature -
// no separate reply queue, no leader address needed at all).
//
// No generic retries: inserts are append-only with no dedup, so retrying after an
// ambiguous failure would duplicate rows. The one exception is an RPC timeout, which
// can legitimately mean "the leader was mid-failover when this was sent" - that's worth
// one retry after forcing a leadership refresh, since a request is only ever delivered
// to whichever replica is ACTUALLY currently consuming the queue (there's no stale
// cached address to go wrong the way an HTTP design would have).

const isTimeoutError = (err: unknown): boolean =>
  err instanceof Error && /RPC timeout/.test(err.message)

const normalizeError = (err: any): Error => {
  if (err instanceof Error) {
    return err
  }

  if (err?.error?.message) {
    const normalized = new Error(err.error.message)
    if (err.error.name) {
      normalized.name = err.error.name
    }
    return normalized
  }

  return new Error('[STORE] Unknown error from store RPC')
}

const request = async <T>(
  op: StoreRpcOp,
  args: unknown[],
  timeout = STORE_FORWARD_TIMEOUT_MS,
  isRetry = false,
): Promise<T> => {
  const leaderId = await waitForLeader()

  if (!leaderId) {
    throw new Error('[STORE] No analytics store leader elected')
  }

  try {
    const response = await AMQP.request(AMQP_STORE_RPC_QUEUE, { op, args }, { timeout })

    return response as T
  } catch (err) {
    if (!isRetry && isTimeoutError(err)) {
      await refreshNow()

      return request<T>(op, args, timeout, true)
    }

    throw normalizeError(err)
  }
}

const select = async (
  table: string,
  filter: FilterQuery,
  cursor?: ICursorOptions,
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: ISortOptions | ISortOptions[],
): Promise<any> => request<any[]>('select', [table, filter, cursor, selectFields, join, groupBy, sortOptions])

const selectStream = async (
  table: string,
  filter: FilterQuery,
  cursor?: ICursorOptions,
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: ISortOptions,
): Promise<Readable> => {
  // duckdb.store.ts's own selectStream already fully materializes the query result
  // before wrapping it in Readable.from(rows) - it's not true incremental streaming.
  // So a follower gets the same behavior by RPC-calling select and wrapping locally,
  // with no need for a second RPC op or any wire-streaming machinery.
  const rows = await select(table, filter, cursor, selectFields, join, groupBy, sortOptions)

  return Readable.from(rows)
}

const countTotal = async (table: string, filter: FilterQuery, join?: string): Promise<number> => {
  const { count } = await request<{ count: number }>('countTotal', [table, filter, join])

  return count
}

const insert = async (table: string, data: any, asyncInsert?: boolean): Promise<void> => {
  await request<void>('insert', [table, data, asyncInsert])
}

const remove = async (table: string, filter: FilterQuery): Promise<void> => {
  await request<void>('remove', [table, filter])
}

const moveDataToS3 = async (
  absoluteS3FileUrl: string,
  table: string,
  filter: FilterQuery,
  s3AccessKeyId?: string,
  secretAccessKey?: string,
  replace?: object,
  sessionToken?: string,
): Promise<void> => {
  await request<void>(
    'moveDataToS3',
    [absoluteS3FileUrl, table, filter, s3AccessKeyId, secretAccessKey, replace, sessionToken],
    STORE_FORWARD_S3_MOVE_TIMEOUT_MS,
  )
}

export const remoteStore = {
  select,
  selectStream,
  countTotal,
  insert,
  remove,
  moveDataToS3,
}
