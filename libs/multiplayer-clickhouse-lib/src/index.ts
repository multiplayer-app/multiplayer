import {
  type ClickHouseClient,
  createClient,
} from '@clickhouse/client'
import { type Readable } from 'stream'
import logger from '@multiplayer/logger'
import {
  CLICKHOUSE_URI,
  CLICKHOUSE_USER,
  CLICKHOUSE_PASSWORD,
} from './config'
import * as QueryBuilder from './query-builder'
export * as ClickHouseTypes from './types'
import * as _ClickHouseTypes from './types'

export let client: ClickHouseClient

export const ClickhouseQueryBuilder = QueryBuilder

export const connect = () => {
  if (client) {
    return
  }

  logger.info(`[CLICKHOUSE] Connecting ${CLICKHOUSE_URI}`)

  client = createClient({
    url: CLICKHOUSE_URI,
    username: CLICKHOUSE_USER,
    password: CLICKHOUSE_PASSWORD,
    request_timeout: 60_000,
    keep_alive: {
      enabled: false,
    },
    compression: {
      request: false,
      response: false,
    },
  })
}

export const disconnect = async () => {
  if (client?.close) {
    await client.close()
  }
}

export const connected = async (): Promise<boolean> => {
  try {
    if (!client?.close) {
      return false
    }

    const data = await client?.query({
      query: 'SHOW DATABASES',
    })

    await data.json()

    return true
  } catch {
    return false
  }
}

export const select = async (
  table: string,
  filter: _ClickHouseTypes.FilterQuery,
  cursor?: _ClickHouseTypes.ICursorOptions,
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: _ClickHouseTypes.ISortOptions | _ClickHouseTypes.ISortOptions[],
): Promise<any> => {
  if (groupBy && !groupBy.startsWith('GROUP BY')) {
    throw new Error('groupBy must start with GROUP BY')
  }

  const conditions = QueryBuilder.buildFilter(filter)
  const sortString = sortOptions
    ? Array.isArray(sortOptions)
      ? `ORDER BY ${sortOptions.map(s => `${s.sortKey} ${s.sortDirection}`).join(', ')}`
      : sortOptions?.sortKey && sortOptions?.sortDirection
        ? `ORDER BY ${sortOptions.sortKey} ${sortOptions.sortDirection}`
        : ''
    : ''
  const cursorString = typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  const query = `SELECT ${selectFields || '*'}
  FROM ${table}
  ${join || ''}
  ${conditions ? `WHERE ${conditions}` : ''}
  ${groupBy || ''}
  ${sortString}
  ${cursorString};`

  logger.trace({ query }, '[CLICKHOUSE] select query')

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const rows = await data.json()

  return rows
}

export const selectStream = async (
  table: string,
  filter: _ClickHouseTypes.FilterQuery,
  cursor?: _ClickHouseTypes.ICursorOptions,
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: _ClickHouseTypes.ISortOptions,
): Promise<Readable> => {
  const conditions = QueryBuilder.buildFilter(filter)
  const sortString = sortOptions?.sortDirection && sortOptions?.sortKey
    ? `ORDER BY ${sortOptions.sortKey} ${sortOptions?.sortDirection}`
    : ''

  const cursorString = typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  const query = `SELECT ${selectFields || '*'}
  FROM ${table}
  ${join || ''}
  ${groupBy || ''}
  ${conditions ? `WHERE ${conditions}` : ''}
  ${sortString}
  ${cursorString}`

  logger.trace({ query }, '[CLICKHOUSE] select query')

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const stream = data.stream()

  stream.on('error', (error) => {
    logger.error('[CLICKHOUSE] stream select query error', error)
  })

  return stream
}

export const rawSelect = async (query: string, returnStream = false): Promise<any> => {
  logger.trace('[CLICKHOUSE] rawSelect query', query)

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  if (!returnStream) {
    return data.json()
  }

  const stream = data.stream()

  stream.on('error', (error) => {
    logger.error('[CLICKHOUSE] stream select query error', error)
  })

  return stream
}

export const countTotal = async (
  table: string,
  filter: _ClickHouseTypes.FilterQuery,
  join?: string,
): Promise<number> => {
  const conditions = QueryBuilder.buildFilter(filter)

  const query = `SELECT count()
  FROM ${table}
  ${join || ''}
  WHERE ${conditions};`

  logger.trace({ query }, '[CLICKHOUSE] countTotal query')

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const rows = await data.json()

  return Number((rows as any[])[0]['count()'] || 0)
}

export const insert = async (
  table: string,
  data: any,
  asyncInsert = false,
) => {
  await client.insert({
    table,
    values: data,
    clickhouse_settings: {
      date_time_input_format: 'best_effort',
      ...asyncInsert ?
        {
          async_insert: 1,
          wait_for_async_insert: 0,
        }
        : {},
    },
    format: 'JSONEachRow',
  })
}

export const remove = async (
  table: string,
  filter: _ClickHouseTypes.FilterQuery,
) => {
  const conditions = QueryBuilder.buildFilter(filter)

  const query = `ALTER TABLE ${table}
    DELETE
    WHERE ${conditions}`

  await client.exec({
    query,
    clickhouse_settings: {
      wait_end_of_query: 1,
    },
  })

  logger.trace({ query }, '[CLICKHOUSE] delete query')
}

export const selectDistinct = async (
  table: string,
  key: string[] | string,
  filter: _ClickHouseTypes.FilterQuery,
  cursor?: _ClickHouseTypes.ICursorOptions,
  order?: string,
  collation?: string,
): Promise<any> => {
  const conditions = QueryBuilder.buildFilter(filter)

  const cursorString = typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''

  const query = `SELECT
  DISTINCT ${Array.isArray(key) ? `ON (${key.join(', ')}) ${key.join(', ')}` : key}
  FROM ${table}
  WHERE ${conditions}
  ${cursorString}
  ${order || ''}
  ${collation || ''};`

  logger.trace({ query }, '[CLICKHOUSE] selectDistinctValues query')

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const rows = await data.json() as any

  return rows
}

export const countTotalDistinctValues = async (
  table: string,
  key: string,
  filter: _ClickHouseTypes.FilterQuery,
): Promise<number> => {
  const conditions = QueryBuilder.buildFilter(filter)

  const query = `SELECT
  count(DISTINCT ${key})
  FROM ${table}
  WHERE ${conditions};`

  logger.trace({ query }, '[CLICKHOUSE] countTotalDistinctValues query')

  const data = await client.query({
    query,
    format: 'JSONEachRow',
  })

  const rows = await data.json()

  return Number((rows as any[])[0][`countDistinct(${key})`] || 0)
}

export const moveDataToS3 = async (
  absoluteS3FileUrl: string,
  table: string,
  filter: _ClickHouseTypes.FilterQuery,
  s3AccessKeyId?: string,
  secretAccessKey?: string,
  replace?: object,
) => {
  const conditions = QueryBuilder.buildFilter(filter)

  const replaceString = replace
    ? QueryBuilder.buildReplace(replace)
    : false

  const query = `
    INSERT INTO FUNCTION
      s3(
        '${absoluteS3FileUrl}', ${s3AccessKeyId && secretAccessKey ? `'${s3AccessKeyId}', '${secretAccessKey}',` : ''}
        'JSONEachRow'
      )
    SELECT *
    ${replaceString ? `REPLACE(${replaceString})` : ''}
    FROM ${table}
    WHERE ${conditions}
    SETTINGS output_format_json_array_of_rows = 1;
    `

  logger.trace({ query }, '[CLICKHOUSE] Export to s3 query')

  await client.command({
    query,
  })
}
