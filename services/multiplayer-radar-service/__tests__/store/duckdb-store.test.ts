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
