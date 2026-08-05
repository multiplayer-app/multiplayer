import { Readable } from 'stream'
import * as Clickhouse from '@multiplayer/clickhouse'

// Re-exported as-is from @multiplayer/clickhouse: these are generic filter/cursor/sort
// shapes, not ClickHouse-specific, and every backend (including a future DuckDB one)
// implements against the same shapes so callers don't need to know which engine is active.
export type FilterQuery = Clickhouse.ClickHouseTypes.FilterQuery
export type ICursorOptions = Clickhouse.ClickHouseTypes.ICursorOptions
export type ISortOptions = Clickhouse.ClickHouseTypes.ISortOptions
export import ClickHouseSortOrder = Clickhouse.ClickHouseTypes.ClickHouseSortOrder

/**
 * Backend-agnostic surface `multiplayer-radar-service` talks to instead of calling
 * `@multiplayer/clickhouse` (or a DuckDB equivalent) directly. Generic CRUD
 * (select/insert/remove/etc.) used for temporary storage of OTLP spans/logs/rrweb
 * events pending S3 archival - detections/detection_params live in MongoDB, see
 * radar-detection.service.ts.
 */
export interface IAnalyticsStore {
  connect(): Promise<void>
  disconnect(): Promise<void>
  connected(): Promise<boolean>

  select(
    table: string,
    filter: FilterQuery,
    cursor?: ICursorOptions,
    selectFields?: string,
    join?: string,
    groupBy?: string,
    sortOptions?: ISortOptions | ISortOptions[],
  ): Promise<any>

  selectStream(
    table: string,
    filter: FilterQuery,
    cursor?: ICursorOptions,
    selectFields?: string,
    join?: string,
    groupBy?: string,
    sortOptions?: ISortOptions,
  ): Promise<Readable>

  countTotal(table: string, filter: FilterQuery, join?: string): Promise<number>

  insert(table: string, data: any, asyncInsert?: boolean): Promise<void>

  remove(table: string, filter: FilterQuery): Promise<void>

  moveDataToS3(
    absoluteS3FileUrl: string,
    table: string,
    filter: FilterQuery,
    s3AccessKeyId?: string,
    secretAccessKey?: string,
    replace?: object,
  ): Promise<void>
}
