import * as Clickhouse from '@multiplayer/clickhouse'
import type {
  IAnalyticsStore,
} from '../types'

export const clickhouseStore: IAnalyticsStore = {
  connect: async () => { Clickhouse.connect() },
  disconnect: Clickhouse.disconnect,
  connected: Clickhouse.connected,
  select: Clickhouse.select,
  selectStream: Clickhouse.selectStream,
  countTotal: Clickhouse.countTotal,
  insert: Clickhouse.insert,
  remove: Clickhouse.remove,
  moveDataToS3: Clickhouse.moveDataToS3,
}
