import { Blocknote } from '@multiplayer/types'
import { Notebook } from '@multiplayer/types'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import * as Y from 'yjs'

const envVarsKey = new PluginKey('envVars')

export const envVarsPlugin = envMap => {
  if (!envMap || !(envMap instanceof Y.Map)) {
    throw new Error('A Y.Map instance is required for envVarsPlugin')
  }

  return new Plugin({
    key: envVarsKey,

    state: {
      init() {
        return envMap // Store the Y.Map reference directly
      },
      apply(_, value) {
        return value
      },
    },
  })
}

export const getEnvVars = (state): Y.Map<unknown> => envVarsKey.getState(state)

export const getGlobalVars = (state): Notebook.AggregateVariable[] => {
  const yEnvs = getEnvVars(state)
  if (!yEnvs) return []
  const yGlobalEnv = yEnvs.get(Blocknote.SourceEnv.GLOBAL) as Y.Map<unknown>
  const yGlobalVars = yGlobalEnv?.get('variables') as Y.Array<Notebook.AggregateVariable>

  if (!yGlobalVars) return []
  return yGlobalVars.toArray()
}

export const EnvVarsExtension = envMap =>
  Extension.create({
    name: 'envVars',
    addProseMirrorPlugins() {
      return [envVarsPlugin(envMap)]
    },
  })
