/* eslint-disable @typescript-eslint/no-var-requires -- ANALYTICS_DB_ENGINE is read once at
   module load time, so exercising each branch needs a fresh require() after resetting the
   module registry; a static import can't be re-evaluated per test case. */

const ORIGINAL_ENV = process.env.ANALYTICS_DB_ENGINE

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.ANALYTICS_DB_ENGINE
  } else {
    process.env.ANALYTICS_DB_ENGINE = ORIGINAL_ENV
  }
  jest.resetModules()
})

describe('Store selection via ANALYTICS_DB_ENGINE', () => {
  it('defaults to the ClickHouse backend when ANALYTICS_DB_ENGINE is unset', () => {
    delete process.env.ANALYTICS_DB_ENGINE
    jest.resetModules()

    const { Store } = require('../../src/store')
    const { clickhouseStore } = require('../../src/store/clickhouse/clickhouse.store')

    expect(Store).toBe(clickhouseStore)
  })

  it('resolves to the ClickHouse backend when explicitly set to "clickhouse"', () => {
    process.env.ANALYTICS_DB_ENGINE = 'clickhouse'
    jest.resetModules()

    const { Store } = require('../../src/store')
    const { clickhouseStore } = require('../../src/store/clickhouse/clickhouse.store')

    expect(Store).toBe(clickhouseStore)
  })

  it('resolves to the DuckDB backend when set to "duckdb"', () => {
    process.env.ANALYTICS_DB_ENGINE = 'duckdb'
    jest.resetModules()

    const { Store } = require('../../src/store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    expect(Store).toBe(duckdbStore)
  })

  it('fails loudly on an unrecognized engine name', () => {
    process.env.ANALYTICS_DB_ENGINE = 'sqlite'
    jest.resetModules()

    expect(() => require('../../src/store')).toThrow(/Unknown ANALYTICS_DB_ENGINE: sqlite/)
  })
})
