jest.mock('@multiplayer/clickhouse', () => {
  const actual = jest.requireActual('@multiplayer/clickhouse')

  return {
    ...actual,
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: jest.fn(),
    select: jest.fn(),
    selectStream: jest.fn(),
    countTotal: jest.fn(),
    insert: jest.fn(),
    remove: jest.fn(),
    moveDataToS3: jest.fn(),
  }
})

import * as Clickhouse from '@multiplayer/clickhouse'
import { clickhouseStore } from '../../src/store/clickhouse/clickhouse.store'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('clickhouseStore generic methods', () => {
  it('connect() wraps the synchronous Clickhouse.connect() in a resolved promise', async () => {
    await expect(clickhouseStore.connect()).resolves.toBeUndefined()
    expect(Clickhouse.connect).toHaveBeenCalledTimes(1)
  })

  it('delegates select/insert/remove/etc. straight through to @multiplayer/clickhouse', async () => {
    expect(clickhouseStore.disconnect).toBe(Clickhouse.disconnect)
    expect(clickhouseStore.connected).toBe(Clickhouse.connected)
    expect(clickhouseStore.select).toBe(Clickhouse.select)
    expect(clickhouseStore.selectStream).toBe(Clickhouse.selectStream)
    expect(clickhouseStore.countTotal).toBe(Clickhouse.countTotal)
    expect(clickhouseStore.insert).toBe(Clickhouse.insert)
    expect(clickhouseStore.remove).toBe(Clickhouse.remove)
    expect(clickhouseStore.moveDataToS3).toBe(Clickhouse.moveDataToS3)
  })
})
