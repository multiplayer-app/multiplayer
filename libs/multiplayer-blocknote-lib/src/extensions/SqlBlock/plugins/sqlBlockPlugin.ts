import { PluginKey, EditorState } from '@tiptap/pm/state'
import {
  clearBlockStates,
  createBlockStatePlugin,
  getBlockState,
  getBlockStates,
  removeBlockState,
  setBlockState,
} from 'src/plugins'
import { SQL_BLOCK_NAME } from 'src/lib/constants'
import { SqlBlockState } from '../types'

export const sqlBlockPluginKey = new PluginKey(SQL_BLOCK_NAME)

export const sqlBlockPlugin = () =>
  createBlockStatePlugin({
    pluginKey: sqlBlockPluginKey,
    sessionStorageKey: 'sqlBlockState',
  })

export const getSqlBlockStates = (state: EditorState): Record<string, SqlBlockState> => {
  return getBlockStates(sqlBlockPluginKey, state)
}

export const getSqlBlockState = (state: EditorState, blockId: string): SqlBlockState => {
  return getBlockState(sqlBlockPluginKey, state, blockId)
}

export const setSqlBlockState = (view: any, blockId: string, payload: Partial<SqlBlockState>) => {
  setBlockState(view, sqlBlockPluginKey, blockId, payload)
}

export const removeSqlBlockState = (view: any, blockId: string) => {
  removeBlockState(view, sqlBlockPluginKey, blockId)
}

export const clearSqlBlockState = (view: any) => {
  clearBlockStates(view, sqlBlockPluginKey)
}
