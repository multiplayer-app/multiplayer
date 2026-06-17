import { Editor } from '@tiptap/core'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { getApiBlockState, apiBlockPluginKey, removeApiBlockState } from '../plugins/apiBlockPlugin'

import { Blocknote } from '@multiplayer/types'
import { getVariableErrors } from '../utils'
import { Notebook } from '@multiplayer/types'
import { ApiBlockState, RestApiNode } from '../types'
import { useGlobals } from 'src/providers'

interface IRestApiBlockContext {
  errors: Notebook.VariableError[]
  blockState: ApiBlockState
  variables: Notebook.AggregateVariable[]

  removeBlockState: () => void
}

const RestApiBlockContext = createContext<IRestApiBlockContext | null>(null)
interface RestApiBlockProviderProps extends PropsWithChildren {
  editor: Editor
  node: RestApiNode
}

const RestApiBlockProvider = ({ children, editor, node }: RestApiBlockProviderProps) => {
  const [blockState, setBlockState] = useState(() => getApiBlockState(editor.state, node.attrs._id))
  const { variables: globalVariables } = useGlobals()

  useEffect(() => {
    const plugin = editor.state.plugins.find(p => p.spec.key === apiBlockPluginKey)

    if (!plugin) return

    const updateBlockState = () => {
      const newState = getApiBlockState(editor.state, node.attrs._id)
      setBlockState(prevState => {
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState
        }
        return prevState
      })
    }

    const transactionHandler = ({ transaction }) => {
      const pluginStateChanged = transaction.getMeta(apiBlockPluginKey)
      if (pluginStateChanged) {
        updateBlockState()
      }
    }

    updateBlockState()
    editor.on('transaction', transactionHandler)
    return () => {
      editor.off('transaction', transactionHandler)
    }
  }, [editor, node.attrs._id])

  const variables = useMemo<Notebook.AggregateVariable[]>(() => {
    const nodeVars = node.attrs.variables || []
    return [
      ...nodeVars
        .filter(v => v.key)
        .map(v => ({ key: v.key, value: v.value, source: Blocknote.SourceEnv.REQUEST, secret: false })),
      ...globalVariables,
    ]
  }, [node.attrs.variables, globalVariables])

  const errors = useMemo(() => getVariableErrors(node.attrs, variables), [node.attrs, variables])

  const removeBlockState = () => {
    removeApiBlockState(editor.view, node.attrs._id)
  }

  return (
    <RestApiBlockContext.Provider value={{ variables, errors, blockState, removeBlockState }}>
      {children}
    </RestApiBlockContext.Provider>
  )
}

export function useRestApiBlock() {
  const context = useContext(RestApiBlockContext)
  if (context === null) {
    throw new Error('useRestApiBlock must be used within RestApiBlockProvider')
  }
  return context
}
export default RestApiBlockProvider
