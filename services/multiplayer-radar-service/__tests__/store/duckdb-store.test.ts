import { duckdbStore } from '../../src/store/duckdb/duckdb.store'

beforeAll(async () => {
  await duckdbStore.connect()
})

afterAll(async () => {
  await duckdbStore.disconnect()
})

describe('duckdbStore connection', () => {
  it('reports connected after connect()', async () => {
    expect(await duckdbStore.connected()).toBe(true)
  })
})

describe('generic CRUD passthrough', () => {
  it('select/insert/countTotal round-trip a plain append-only table', async () => {
    const table = 'debug_session.rrweb_events'
    await duckdbStore.insert(table, [{
      id: 'rrweb-1',
      workspaceId: 'w5',
      projectId: 'p5',
      debugSessionId: 'ds1',
      type: 2,
      data: '{}',
      timestamp: new Date().toISOString(),
    }])

    const rows = await duckdbStore.select(table, { debugSessionId: 'ds1' })
    const count = await duckdbStore.countTotal(table, { debugSessionId: 'ds1' })

    expect(rows).toHaveLength(1)
    expect(count).toBe(1)
  })
})

describe('getConnection: race with an in-flight connect()', () => {
  it('a query issued while connect() is still running waits for it instead of throwing "Not connected"', async () => {
    await duckdbStore.disconnect()

    const connectPromise = duckdbStore.connect()
    // Fired in the same tick, before connect() has resolved - this is the exact race
    // that used to throw "[DUCKDB] Not connected - call Store.connect() first" in
    // production (the raw DuckDB driver has no built-in operation buffering the way
    // Mongoose gives Mongo for free).
    const countPromise = duckdbStore.countTotal('debug_session.rrweb_events', { debugSessionId: 'race-check' })

    await expect(countPromise).resolves.toEqual(expect.any(Number))
    await connectPromise
    expect(await duckdbStore.connected()).toBe(true)
  })
})
