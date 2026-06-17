import { Editor } from '@tiptap/core'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

import { RunnableCodeBlockAttributes, RunnableCodeBlockState } from '../types'
import { getCodeBlockState, removeCodeBlockState, runnableCodePluginKey } from '../plugins'

interface IRunnableCodeBlockContext {
  blockName: string
  blockState: RunnableCodeBlockState
  removeBlockState: () => void
}

const RunnableCodeBlockContext = createContext<IRunnableCodeBlockContext | null>(null)

interface RunnableCodeBlockProviderProps extends PropsWithChildren {
  editor: Editor
  attrs: RunnableCodeBlockAttributes
}

const RunnableCodeBlockProvider = ({ children, editor, attrs }: RunnableCodeBlockProviderProps) => {
  const [blockState, setBlockState] = useState(() => getCodeBlockState(editor.state, attrs._id))

  useEffect(() => {
    const updateBlockState = () => {
      const newState = getCodeBlockState(editor.state, attrs._id)
      setBlockState(prevState => {
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState
        }
        return prevState
      })
    }

    const plugin = editor.state.plugins.find(p => p.spec.key === runnableCodePluginKey)

    if (!plugin) return

    const transactionHandler = ({ transaction }) => {
      const pluginStateChanged = transaction.getMeta(runnableCodePluginKey)
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
    removeCodeBlockState(editor.view, attrs._id)
  }

  return (
    <RunnableCodeBlockContext.Provider value={{ blockName: attrs._globalName, blockState, removeBlockState }}>
      {children}
    </RunnableCodeBlockContext.Provider>
  )
}

export function useRunnableCodeBlock() {
  const context = useContext(RunnableCodeBlockContext)
  if (context === null) {
    throw new Error('useRunnableCodeBlock must be used within RunnableCodeBlockProvider')
  }
  return context
}
export default RunnableCodeBlockProvider
