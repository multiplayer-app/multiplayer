import { Transform } from 'stream'

// Expects one plain row object per chunk - both the ClickHouse and DuckDB store
// adapters normalize to this same shape now (see @multiplayer/clickhouse's
// normalizeStream and duckdb.store.ts's Readable.from(rows)), so this stays
// backend-agnostic rather than assuming either engine's native wire format.
export const transformClickhouseStream = (cursor?) => {
  let firstPush = true

  const transformStream = new Transform({
    writableObjectMode: true,
    autoDestroy: true,
    transform(row, encoding, callback) {
      if (firstPush) {
        this.push('{"data": [')
      } else {
        this.push(',')
      }

      this.push(JSON.stringify(row))

      firstPush = false

      return callback()
    },
    flush(callback) {
      if (firstPush) {
        this.push('{"data": [')
      }

      if (cursor) {
        this.push(`], "cursor": ${JSON.stringify(cursor)}}`)
      } else {
        this.push(']}')
      }

      return callback()
    },
  })

  return transformStream
}
