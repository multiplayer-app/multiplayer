import { ClickHouseSortOrder } from './sort-order.enum'

export interface ISortOptions {
  sortKey: string
  sortDirection: ClickHouseSortOrder
}
