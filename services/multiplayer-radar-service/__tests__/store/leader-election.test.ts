// The mock's backing store must survive jest.resetModules() (each test needs a fresh
// leader-election module instance, since selfId is generated once at module load time)
// - so it's declared here, outside the factory, and referenced by name. Jest's mock
// hoisting only allows out-of-scope references to identifiers starting with "mock".
// NOTE: the jest.fn() wrappers themselves (get/set/del/client.set) are NOT similarly
// persistent - resetModules() re-invokes this factory and produces brand new mock
// functions each time, so tests must re-require '@multiplayer/redis' fresh after every
// reset rather than relying on a single static top-level import.
const mockRedisStore: Record<string, string> = {}

jest.mock('@multiplayer/redis', () => {
  const get = jest.fn(async (key: string) => (key in mockRedisStore ? mockRedisStore[key] : null))

  const set = jest.fn(async (
    key: string,
    value: string,
    _expireInSeconds?: number,
    options: { NX?: boolean, XX?: boolean } = {},
  ) => {
    if (options.NX && key in mockRedisStore) {
      return null
    }
    if (options.XX && !(key in mockRedisStore)) {
      return null
    }
    mockRedisStore[key] = value
    return 'OK'
  })

  const del = jest.fn(async (key: string) => {
    delete mockRedisStore[key]
  })

  const client = {
    set: jest.fn(async (
      key: string,
      value: string,
      options: { NX?: boolean, XX?: boolean } = {},
    ) => set(key, value, undefined, options)),
  }

  return {
    __esModule: true,
    default: { get, set, del },
    client,
    get,
    set,
    del,
  }
})

const LEASE_KEY = 'radar:duckdb:leader'

const importLeaderElection = () => {
  jest.resetModules()

  for (const key of Object.keys(mockRedisStore)) {
    delete mockRedisStore[key]
  }

  process.env.ANALYTICS_DB_ENGINE = 'duckdb'

  /* eslint-disable @typescript-eslint/no-var-requires -- fresh instances of both
     modules needed per test: selfId is generated once at leader-election's module
     load time, and the redis mock's jest.fn()s are recreated by the factory on every
     resetModules(), so RedisMock must be re-required here too, not imported once
     statically at file scope. */
  const RedisMock = require('@multiplayer/redis')
  const LeaderElection = require('../../src/store/leader-election')
  /* eslint-enable @typescript-eslint/no-var-requires */

  return { LeaderElection, RedisMock }
}

describe('leader-election', () => {
  afterEach(async () => {
    jest.restoreAllMocks()
  })

  it('acquires the lease when it is unset', async () => {
    const { LeaderElection } = importLeaderElection()

    await LeaderElection.refreshNow()

    expect(LeaderElection.isLeader()).toBe(true)
    expect(LeaderElection.getState()).toBe('leader')
    expect(LeaderElection.getLeaderId()).toBe(LeaderElection.getSelfId())
  })

  it('renews its own lease on subsequent ticks', async () => {
    const { LeaderElection, RedisMock } = importLeaderElection()

    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(true)

    await LeaderElection.refreshNow()

    expect(LeaderElection.isLeader()).toBe(true)
    expect(RedisMock.client.set).toHaveBeenCalledWith(
      LEASE_KEY,
      LeaderElection.getSelfId(),
      expect.objectContaining({ XX: true }),
    )
  })

  it('follows when another value already holds the lease', async () => {
    const { LeaderElection } = importLeaderElection()

    mockRedisStore[LEASE_KEY] = 'some-other-replica'

    await LeaderElection.refreshNow()

    expect(LeaderElection.isLeader()).toBe(false)
    expect(LeaderElection.getState()).toBe('follower')
    expect(LeaderElection.getLeaderId()).toBe('some-other-replica')
  })

  it('takes over once the lease is cleared (simulated expiry)', async () => {
    const { LeaderElection } = importLeaderElection()

    mockRedisStore[LEASE_KEY] = 'some-other-replica'
    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(false)

    delete mockRedisStore[LEASE_KEY]
    await LeaderElection.refreshNow()

    expect(LeaderElection.isLeader()).toBe(true)
    expect(LeaderElection.getLeaderId()).toBe(LeaderElection.getSelfId())
  })

  it('stop() releases only its own lease', async () => {
    const { LeaderElection } = importLeaderElection()

    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(true)

    await LeaderElection.stop()

    expect(mockRedisStore[LEASE_KEY]).toBeUndefined()
    expect(LeaderElection.getState()).toBe('idle')
  })

  it('stop() does not release a lease held by someone else', async () => {
    const { LeaderElection } = importLeaderElection()

    mockRedisStore[LEASE_KEY] = 'some-other-replica'
    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(false)

    await LeaderElection.stop()

    expect(mockRedisStore[LEASE_KEY]).toBe('some-other-replica')
  })

  it('degrades to "unknown" (sticky, ex-leader keeps acting as leader) after 3 consecutive redis failures', async () => {
    const { LeaderElection, RedisMock } = importLeaderElection()

    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(true)

    RedisMock.get.mockRejectedValue(new Error('ECONNREFUSED'))

    await LeaderElection.refreshNow()
    await LeaderElection.refreshNow()
    expect(LeaderElection.getState()).toBe('leader') // below threshold, state unchanged

    await LeaderElection.refreshNow()

    expect(LeaderElection.getState()).toBe('unknown')
    expect(LeaderElection.isLeader()).toBe(true) // still acting leader while unknown
  })

  it('a follower in "unknown" state is not treated as leader', async () => {
    const { LeaderElection, RedisMock } = importLeaderElection()

    mockRedisStore[LEASE_KEY] = 'some-other-replica'
    await LeaderElection.refreshNow()
    expect(LeaderElection.isLeader()).toBe(false)

    RedisMock.get.mockRejectedValue(new Error('ECONNREFUSED'))

    await LeaderElection.refreshNow()
    await LeaderElection.refreshNow()
    await LeaderElection.refreshNow()

    expect(LeaderElection.getState()).toBe('unknown')
    expect(LeaderElection.isLeader()).toBe(false)
  })

  it('waitForLeader resolves once a leader is acquired', async () => {
    const { LeaderElection } = importLeaderElection()

    const result = await LeaderElection.waitForLeader(2000)

    expect(result).toBe(LeaderElection.getSelfId())
  })

  it('waitForLeader returns null if no leader appears within the timeout', async () => {
    const { LeaderElection, RedisMock } = importLeaderElection()

    RedisMock.get.mockRejectedValue(new Error('ECONNREFUSED'))
    RedisMock.set.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await LeaderElection.waitForLeader(600)

    expect(result).toBeNull()
  })

  it('fires onGain exactly once when leadership is acquired, and onLoss exactly once when lost', async () => {
    const { LeaderElection } = importLeaderElection()
    const onGain = jest.fn()
    const onLoss = jest.fn()

    LeaderElection.start({ onGain, onLoss })
    await LeaderElection.refreshNow()

    expect(onGain).toHaveBeenCalledTimes(1)
    expect(onLoss).not.toHaveBeenCalled()

    await LeaderElection.refreshNow()
    expect(onGain).toHaveBeenCalledTimes(1) // still leader - no repeat firing

    mockRedisStore[LEASE_KEY] = 'some-other-replica'
    await LeaderElection.refreshNow()

    expect(onLoss).toHaveBeenCalledTimes(1)
    expect(onGain).toHaveBeenCalledTimes(1)

    await LeaderElection.stop()
  })

  it('start() is a no-op when ANALYTICS_DB_ENGINE is not duckdb', async () => {
    jest.resetModules()
    process.env.ANALYTICS_DB_ENGINE = 'clickhouse'

    // ANALYTICS_DB_ENGINE must be set to 'clickhouse' before this fresh require, not after.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LeaderElection = require('../../src/store/leader-election')
    const onGain = jest.fn()

    LeaderElection.start({ onGain })
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(LeaderElection.getState()).toBe('idle')
    expect(onGain).not.toHaveBeenCalled()

    process.env.ANALYTICS_DB_ENGINE = 'duckdb'
  })
})
