export interface GitCursor {
  page?: number
  perPage?: number
  nextPage: number
}

export interface DataWithGitCursor<T> {
  cursor: GitCursor
  data: Array<T>
}
