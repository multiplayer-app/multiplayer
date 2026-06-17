import { EditorState, PluginKey } from '@tiptap/pm/state'
import {
  clearBlockStates,
  createBlockStatePlugin,
  getBlockState,
  getBlockStates,
  removeBlockState,
  setBlockState,
} from 'src/plugins'
import { ApiBlockState } from '../types'
import { RUNNABLE_API_BLOCK_NAME } from 'src/lib/constants'

export const apiBlockPluginKey = new PluginKey(RUNNABLE_API_BLOCK_NAME)
export const apiBlockPlugin = () =>
  createBlockStatePlugin({
    pluginKey: apiBlockPluginKey,
    sessionStorageKey: 'apiBlockState',
  })

// Retrieve the entire plugin state
export const getApiBlockStates = (state: EditorState): Record<string, ApiBlockState> => {
  return getBlockStates(apiBlockPluginKey, state)
}

// Retrieve state for a specific block by ID
export const getApiBlockState = (state: EditorState, blockId: string): ApiBlockState => {
  return getBlockState(apiBlockPluginKey, state, blockId)
}

// Update the state of a specific block
export const setApiBlockState = (view: any, blockId: string, payload: Partial<ApiBlockState>) => {
  setBlockState(view, apiBlockPluginKey, blockId, payload)
}

// Remove the state of a specific block
export const removeApiBlockState = (view: any, blockId: string) => {
  removeBlockState(view, apiBlockPluginKey, blockId)
}

// Remove the state of a all blocks
export const clearApiBlockState = (view: any) => {
  clearBlockStates(view, apiBlockPluginKey)
}
