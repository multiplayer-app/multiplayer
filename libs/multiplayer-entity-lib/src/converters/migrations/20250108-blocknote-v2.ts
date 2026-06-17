import * as Y from 'yjs'
import { Blocknote } from '@multiplayer/types'
import { SourceEnv, EnvData } from '@multiplayer/types/src/entity-data/notebook-data'
import { BlocknoteTemplates } from '../../templates'


export function migrateBlocknoteToV2(doc: Y.Doc) {
  const yEnvironments = doc.getMap('environments')
  setEnvironments(BlocknoteTemplates.empty().environments, yEnvironments)
}

function setEnvironments(environments: Record<SourceEnv | string, EnvData>, yEnvironments: Y.Map<unknown>) {
  Object.keys(environments).forEach(envKey=> {
    const envData = environments[envKey]
    const map = new Y.Map<unknown>()
    yEnvironments.set(envKey, map)
    setVariables(envData, map)
  })
}

function setVariables(data: Blocknote.EnvData, yMap: Y.Map<unknown>) {
  const yVariables = new Y.Array<Blocknote.AggregateVariable>()
  yMap.set('variables', yVariables)
  yVariables.insert(0, data.variables)
}