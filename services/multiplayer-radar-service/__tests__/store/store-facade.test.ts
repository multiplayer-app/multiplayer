/* eslint-disable @typescript-eslint/no-var-requires -- leadership state must be mocked
   BEFORE src/store is required, and jest.resetModules() between cases means a static
   import can't be re-evaluated per test case. */

const ORIGINAL_ENV = process.env.ANALYTICS_DB_ENGINE

beforeEach(() => {
  process.env.ANALYTICS_DB_ENGINE = 'duckdb'
  jest.resetModules()
})

afterEach(() => {
  if (ORIGINAL_ENV === undefined) {
    delete process.env.ANALYTICS_DB_ENGINE
  } else {
    process.env.ANALYTICS_DB_ENGINE = ORIGINAL_ENV
  }
  jest.restoreAllMocks()
})

describe('Store leader facade dispatch', () => {
  it('routes data calls to the local backend when this replica is leader', async () => {
    jest.doMock('../../src/store/leader-election', () => ({
      isLeader: () => true,
      getState: () => 'leader',
    }))

    const { Store } = require('../../src/store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    const localSpy = jest.spyOn(duckdbStore, 'countTotal').mockResolvedValue(3)

    const result = await Store.countTotal('table', {})

    expect(localSpy).toHaveBeenCalledWith('table', {})
    expect(result).toBe(3)
  })

  it('routes data calls to the remote store when this replica is a follower', async () => {
    jest.doMock('../../src/store/leader-election', () => ({
      isLeader: () => false,
      getState: () => 'follower',
    }))
    jest.doMock('../../src/store/remote/remote.store', () => ({
      remoteStore: {
        countTotal: jest.fn().mockResolvedValue(7),
      },
    }))

    const { Store } = require('../../src/store')
    const { remoteStore } = require('../../src/store/remote/remote.store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    const localSpy = jest.spyOn(duckdbStore, 'countTotal')

    const result = await Store.countTotal('table', {})

    expect(remoteStore.countTotal).toHaveBeenCalledWith('table', {})
    expect(localSpy).not.toHaveBeenCalled()
    expect(result).toBe(7)
  })

  it('always uses the local backend for connect/disconnect/connected regardless of leadership', async () => {
    jest.doMock('../../src/store/leader-election', () => ({
      isLeader: () => false,
      getState: () => 'follower',
    }))
    jest.doMock('../../src/store/remote/remote.store', () => ({
      remoteStore: {
        select: jest.fn(),
      },
    }))

    const { Store } = require('../../src/store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    const connectedSpy = jest.spyOn(duckdbStore, 'connected').mockResolvedValue(true)

    const result = await Store.connected()

    expect(connectedSpy).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('treats an idle election (never started) as acting-local, same as a leader', async () => {
    jest.doMock('../../src/store/leader-election', () => ({
      isLeader: () => false,
      getState: () => 'idle',
    }))

    const { Store } = require('../../src/store')
    const { duckdbStore } = require('../../src/store/duckdb/duckdb.store')

    const localSpy = jest.spyOn(duckdbStore, 'insert').mockResolvedValue(undefined)

    await Store.insert('table', { id: '1' })

    expect(localSpy).toHaveBeenCalledWith('table', { id: '1' })
  })
})
