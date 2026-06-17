import { EditorState, PluginKey, Plugin } from '@tiptap/pm/state'
import debounce from 'lodash.debounce'
import LZString from 'lz-string'

export type BlockState = {
  _id: string
  _globalName: string
  running: boolean
  waiting: boolean
  updatedAt: string
  createdAt: string
  [key: string]: any
}

type PluginFactoryOptions = {
  pluginKey: PluginKey
  sessionStorageKey: string
}

export function createBlockStatePlugin({ pluginKey, sessionStorageKey }: PluginFactoryOptions) {
  const path = location.pathname.split('/').pop()
  const uniqueStorageKey = `${path}_${sessionStorageKey}`
  const saveToSessionStorage = debounce((state: Record<string, BlockState>) => {
    try {
      const compressed = LZString.compressToUTF16(JSON.stringify(state))
      sessionStorage.setItem(uniqueStorageKey, compressed)
    } catch (error) {
      console.error(error)
    }
  }, 300)

  function loadFromSessionStorage(): Record<string, BlockState> {
    const savedState = sessionStorage.getItem(uniqueStorageKey)
    if (!savedState) return {}
    try {
      const data = JSON.parse(LZString.decompressFromUTF16(savedState) || '{}')
      return Object.keys(data).reduce((acc, key) => {
        acc[key] = { ...data[key], running: false, waiting: false }
        return acc
      }, {})
    } catch (e) {
      return {}
    }
  }

  return new Plugin({
    key: pluginKey,
    state: {
      init: () => loadFromSessionStorage(),

      apply(tr, value) {
        const meta = tr.getMeta(pluginKey)
        if (!meta) return value

        const { _id, action, ...rest } = meta
        const currentDate = new Date().toISOString()
        const prev = value[_id] || {}
        let updatedState = { ...value }

        if (action === 'clear') {
          sessionStorage.removeItem(uniqueStorageKey)
          return {}
        } else if (action === 'remove') {
          delete updatedState[_id]
        } else {
          updatedState = {
            ...value,
            [_id]: {
              ...prev,
              ...rest,
              updatedAt: currentDate,
              createdAt: prev.createdAt || currentDate,
            },
          }
        }

        saveToSessionStorage(updatedState)
        return updatedState
      },
    },
  })
}

// Retrieve the entire plugin state
export function getBlockStates(pluginKey: PluginKey, state: EditorState) {
  return pluginKey.getState(state) || {}
}

// Retrieve state for a specific block by ID
export function getBlockState(pluginKey: PluginKey, state: EditorState, blockId: string) {
  const pluginState = pluginKey.getState(state)
  return pluginState?.[blockId] || { _id: blockId, running: false }
}

// Update the state of a specific block
export function setBlockState(view: any, pluginKey: PluginKey, blockId: string, payload: Partial<BlockState>) {
  const currentState = getBlockState(pluginKey, view.state, blockId)
  const newState = { ...currentState, ...payload }
  const isEqual = JSON.stringify(currentState) === JSON.stringify(newState)
  if (isEqual) return
  const tr = view.state.tr.setMeta(pluginKey, { _id: blockId, ...payload })
  view.dispatch(tr)
}

// Remove the state of a specific block
export function removeBlockState(view: any, pluginKey: PluginKey, blockId: string) {
  const tr = view.state.tr.setMeta(pluginKey, { _id: blockId, action: 'remove' })
  view.dispatch(tr)
}

// Remove the state of a specific block
export function clearBlockStates(view: any, pluginKey: PluginKey) {
  const tr = view.state.tr.setMeta(pluginKey, { action: 'clear' })
  view.dispatch(tr)
}
