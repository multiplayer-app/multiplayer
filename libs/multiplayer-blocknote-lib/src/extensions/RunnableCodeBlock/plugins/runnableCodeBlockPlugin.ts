import { PluginKey, EditorState } from '@tiptap/pm/state'
import {
  clearBlockStates,
  createBlockStatePlugin,
  getBlockState,
  getBlockStates,
  removeBlockState,
  setBlockState,
} from 'src/plugins'
import { RunnableCodeBlockState } from '../types'
import { RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'

export const runnableCodePluginKey = new PluginKey(RUNNABLE_CODE_BLOCK_NAME)

export const codeBlockPlugin = () =>
  createBlockStatePlugin({
    pluginKey: runnableCodePluginKey,
    sessionStorageKey: 'runnableCodeState',
  })

// Retrieve the entire plugin state
export const getCodeBlockStates = (state: EditorState): Record<string, RunnableCodeBlockState> => {
  return getBlockStates(runnableCodePluginKey, state)
}

// Retrieve state for a specific block by ID
export const getCodeBlockState = (state: EditorState, blockId: string): RunnableCodeBlockState => {
  return getBlockState(runnableCodePluginKey, state, blockId)
}

// Update the state of a specific block
export const setCodeBlockState = (view: any, blockId: string, payload: Partial<RunnableCodeBlockState>) => {
  setBlockState(view, runnableCodePluginKey, blockId, payload)
}

// Remove the state of a specific block
export const removeCodeBlockState = (view: any, blockId: string) => {
  removeBlockState(view, runnableCodePluginKey, blockId)
}

// Remove the state of a all blocks
export const clearCodeBlockState = (view: any) => {
  clearBlockStates(view, runnableCodePluginKey)
}
