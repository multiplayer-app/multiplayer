import { Node } from '@tiptap/pm/model'
import { BlockState } from 'src/plugins'

export interface SqlQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  durationMs?: number
}

export type SqlQueryExecutor = (query: string, signal?: AbortSignal) => Promise<SqlQueryResult>

export interface SqlBlockAttributes {
  _id: string
  _runnable: boolean
  _globalName: string
  query: string
}

export interface SqlBlockState extends BlockState {
  error?: string | null
  result?: SqlQueryResult | null
}

export interface SqlBlockNode extends Node {
  attrs: SqlBlockAttributes
}
