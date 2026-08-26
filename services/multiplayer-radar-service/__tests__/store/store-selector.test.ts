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

  it('wraps the DuckDB backend in a leader-election facade when set to "duckdb"', async () => {
    process.env.ANALYTICS_DB_ENGINE = 'duckdb'
    jest.resetModules()

    const { Store, localStore } = require('../../src/store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    // localStore is always the raw engine-selected backend, unwrapped.
    expect(localStore).toBe(duckdbStore)
    // Store is a distinct facade object, not the backend itself...
    expect(Store).not.toBe(duckdbStore)

    // ...but with election never started (state 'idle'), every call still resolves
    // straight through to the local backend - existing single-replica/test behavior
    // is unchanged.
    const selectSpy = jest.spyOn(duckdbStore, 'select').mockResolvedValue(['row'])

    const result = await Store.select('table', { id: '1' })

    expect(selectSpy).toHaveBeenCalledWith('table', { id: '1' })
    expect(result).toEqual(['row'])

    selectSpy.mockRestore()
  })

  it('fails loudly on an unrecognized engine name', () => {
    process.env.ANALYTICS_DB_ENGINE = 'sqlite'
    jest.resetModules()

    expect(() => require('../../src/store')).toThrow(/Unknown ANALYTICS_DB_ENGINE: sqlite/)
  })
})
