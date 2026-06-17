import * as Y from 'yjs'
import { Editor } from '@tiptap/core'
import { Notebook } from '@multiplayer/types'
import { Blocknote } from '@multiplayer/types'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

import { ISecretsManager } from 'src/types'
import { getEnvVars } from 'src/extensions/EnvironmentVariables'
import { getGlobalState } from 'src/extensions/RunnableCodeBlock/utils'
import { apiBlockPluginKey } from 'src/extensions/RestApiBlock/plugins'
import { runnableCodePluginKey } from 'src/extensions/RunnableCodeBlock/plugins'
import { predefinedVars } from './predefinedVariables'

interface IGlobalsContext {
  variables: Notebook.AggregateVariable[]
  aggregatedVariables: Record<string, any>
  globalState: Notebook.GlobalState
}

const GlobalsContext = createContext<IGlobalsContext | null>(null)

interface VariablesProviderProps extends PropsWithChildren {
  editor: Editor
  secretsManager: ISecretsManager | null
}

const VariablesProvider = ({ children, editor, secretsManager }: VariablesProviderProps) => {
  const [globalVars, setGlobalVars] = useState<Notebook.AggregateVariable[]>(
    getYGlobalVars(editor, 'variables')?.toArray() ?? [],
  )
  const [secretsVars, setSecretsVars] = useState<Notebook.AggregateVariable[]>(
    getYGlobalVars(editor, 'secrets')?.toArray() ?? [],
  )
  const [globalState, setGlobalState] = useState<Notebook.GlobalState>(getGlobalState(editor.state))

  useEffect(() => {
    const yGlobalVars = getYGlobalVars(editor, 'variables')
    const ySecretsVars = getYGlobalVars(editor, 'secrets')

    if (!yGlobalVars || !ySecretsVars) return

    const updateGlobalVarsState = () => {
      setGlobalVars(yGlobalVars.toArray())
    }

    const updateSecretVarsState = async () => {
      const localSecrets = secretsManager ? await secretsManager?.getAllSecrets() : []
      const localSecretsMap = new Map(localSecrets.map(secret => [secret.key, secret.value]))

      setSecretsVars(ySecretsVars.toArray().map(s => ({ ...s, value: localSecretsMap.get(s.key) })) ?? [])
    }

    updateGlobalVarsState()
    updateSecretVarsState()

    yGlobalVars.observe(updateGlobalVarsState)
    ySecretsVars.observe(updateSecretVarsState)
    return () => {
      yGlobalVars.unobserve(updateGlobalVarsState)
      ySecretsVars.unobserve(updateSecretVarsState)
    }
  }, [editor])

  useEffect(() => {
    const globalStateChangeListener = ({ transaction }) => {
      const apiStateChanged = transaction.getMeta(apiBlockPluginKey)
      const codeStateChanged = transaction.getMeta(runnableCodePluginKey)
      if (apiStateChanged || codeStateChanged) {
        setGlobalState(getGlobalState(editor.state))
      }
    }

    editor.on('transaction', globalStateChangeListener)
    return () => {
      editor.off('transaction', globalStateChangeListener)
    }
  }, [editor])

  const variables = useMemo<Notebook.AggregateVariable[]>(() => {
    return [
      ...globalVars.filter(v => v.key).map(v => ({ key: v.key, value: v.value, source: Blocknote.SourceEnv.GLOBAL })),
      ...secretsVars.filter(v => v.key).map(v => ({ key: v.key, value: v.value, source: Blocknote.SourceEnv.GLOBAL })),
      ...Object.keys(globalState.variables).map(key => ({
        key,
        value: globalState.variables[key],
        source: Blocknote.SourceEnv.BLOCK,
        description: 'Runnable block output',
      })),
      ...predefinedVars,
    ]
  }, [globalVars, secretsVars, globalState])

  const aggregatedVariables = useMemo(() => {
    return variables.reduce((acc, v) => {
      if (v.source === Blocknote.SourceEnv.PREDEFINED) {
        acc[v.key] = typeof v.getValue === 'function' ? v.getValue() : v.value
      } else {
        acc[v.key] = v.value
      }
      return acc
    }, {})
  }, [variables])

  return (
    <GlobalsContext.Provider value={{ variables, aggregatedVariables, globalState }}>
      {children}
    </GlobalsContext.Provider>
  )
}

function getYGlobalVars(editor: Editor, key: string) {
  if (!editor) return null
  const yEnvs = getEnvVars(editor.state)
  const yGlobalEnv = yEnvs?.get(Blocknote.SourceEnv.GLOBAL) as Y.Map<unknown>
  const yGlobalVars = yGlobalEnv?.get(key) as Y.Array<Notebook.AggregateVariable>
  return yGlobalVars
}

export function useGlobals() {
  const context = useContext(GlobalsContext)
  if (context === null) {
    throw new Error('useGlobals must be used within VariablesProvider')
  }
  return context
}

export { VariablesProvider }
