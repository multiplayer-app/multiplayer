// Real round trip against RabbitMQ (same convention as duckdb-store.test.ts/
// radar-detection.test.ts using a real DuckDB/Mongo connection rather than mocking the
// dependency) - proves remote.store.ts's AMQP.request calls actually reach
// leader-listener.ts's AMQP.listen handler and get dispatched to a real local store.
// Leader-election itself is mocked here (it already has its own dedicated test file) -
// this test only needs to agree that "there is a leader", not re-verify how one gets
// elected.
jest.mock('../../src/store/leader-election', () => ({
  waitForLeader: jest.fn().mockResolvedValue('fixed-leader-id'),
  refreshNow: jest.fn().mockResolvedValue(undefined),
}))

import AMQP from '@multiplayer/amqp'
import { duckdbStore } from '../../src/store/duckdb/duckdb.store'
import { remoteStore } from '../../src/store/remote/remote.store'
import * as LeaderListener from '../../src/store/leader-listener'

const TABLE = 'debug_session.rrweb_events'

const rrwebRow = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 'remote-rrweb-1',
  workspaceId: 'w-remote',
  projectId: 'p-remote',
  debugSessionId: 'ds-remote',
  type: 2,
  data: '{}',
  timestamp: new Date().toISOString(),
  ...overrides,
})

beforeAll(async () => {
  await AMQP.connect()
  await duckdbStore.connect()
  // leader-listener.ts's handlers dispatch to '../store'.localStore, which resolves to
  // duckdbStore whenever ANALYTICS_DB_ENGINE=duckdb (already the case per .env.test,
  // confirmed by store-selector.test.ts) - so starting it here exercises the real
  // module wiring, not a stand-in.
  await LeaderListener.start()
})

afterAll(async () => {
  await LeaderListener.stop()
  await duckdbStore.disconnect()
  await AMQP.disconnect()
})

describe('remote store <-> leader listener round trip', () => {
  it('insert/select/countTotal/remove all reach the leader and operate on its local store', async () => {
    await remoteStore.insert(TABLE, [rrwebRow()])

    const rows = await remoteStore.select(TABLE, { debugSessionId: 'ds-remote' })
    const count = await remoteStore.countTotal(TABLE, { debugSessionId: 'ds-remote' })

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('remote-rrweb-1')
    expect(count).toBe(1)

    await remoteStore.remove(TABLE, { debugSessionId: 'ds-remote' })

    const remaining = await remoteStore.countTotal(TABLE, { debugSessionId: 'ds-remote' })
    expect(remaining).toBe(0)
  })

  it('selectStream yields one plain row per chunk, matching select() - no NDJSON/HTTP machinery needed', async () => {
    await remoteStore.insert(TABLE, [rrwebRow({ id: 'remote-rrweb-stream', debugSessionId: 'ds-remote-stream' })])

    const stream = await remoteStore.selectStream(TABLE, { debugSessionId: 'ds-remote-stream' })

    const seen: any[] = []
    for await (const row of stream) {
      expect(Array.isArray(row)).toBe(false)
      expect(typeof (row as any).json).toBe('undefined')
      seen.push(row)
    }

    expect(seen).toHaveLength(1)
    expect(seen[0].id).toBe('remote-rrweb-stream')

    await remoteStore.remove(TABLE, { debugSessionId: 'ds-remote-stream' })
  })

  it('propagates a leader-side failure back to the caller as a real Error, not a plain {error} object', async () => {
    await expect(
      remoteStore.select('table_that_does_not_exist_xyz', {}),
    ).rejects.toBeInstanceOf(Error)
  })
})
