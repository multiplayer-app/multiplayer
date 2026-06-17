export interface ICursor {
  skip?: number
  limit?: number
}

export interface ICurrentCursor {
  skip?: number
  limit?: number
  total: number
}

export interface DataWithCursor<T> {
  cursor: ICurrentCursor
  data: Array<T>
}
