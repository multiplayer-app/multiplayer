export interface IListResponse<T> {
  cursor: { total: number; skip: number; limit: number };
  data: T[];
  totalComments?: number;
}
