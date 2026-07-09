import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { Editor } from '@tiptap/core'

import { SqlBlockAttributes, SqlBlockState } from '../types'
import { getSqlBlockState, removeSqlBlockState, sqlBlockPluginKey } from '../plugins'

interface ISqlBlockContext {
  blockState: SqlBlockState
  removeBlockState: () => void
}

const SqlBlockContext = createContext<ISqlBlockContext | null>(null)

interface SqlBlockProviderProps extends PropsWithChildren {
  editor: Editor
  attrs: SqlBlockAttributes
}

const SqlBlockProvider = ({ children, editor, attrs }: SqlBlockProviderProps) => {
  const [blockState, setBlockState] = useState(() => getSqlBlockState(editor.state, attrs._id))

  useEffect(() => {
    const updateBlockState = () => {
      const newState = getSqlBlockState(editor.state, attrs._id)
      setBlockState(prevState => {
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState
        }
        return prevState
      })
    }

    const plugin = editor.state.plugins.find(p => p.spec.key === sqlBlockPluginKey)
    if (!plugin) return

    const transactionHandler = ({ transaction }) => {
      const pluginStateChanged = transaction.getMeta(sqlBlockPluginKey)
      if (pluginStateChanged) {
        updateBlockState()
      }
    }

    editor.on('transaction', transactionHandler)
    updateBlockState()

    return () => {
      editor.off('transaction', transactionHandler)
    }
  }, [editor, attrs._id])

  const removeBlockState = () => {
    removeSqlBlockState(editor.view, attrs._id)
  }

  return (
    <SqlBlockContext.Provider value={{ blockState, removeBlockState }}>
      {children}
    </SqlBlockContext.Provider>
  )
}

export function useSqlBlock() {
  const context = useContext(SqlBlockContext)
  if (context === null) {
    throw new Error('useSqlBlock must be used within SqlBlockProvider')
  }
  return context
}

export default SqlBlockProvider
