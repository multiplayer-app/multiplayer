import * as Y from 'yjs'
import { Blocknote, EntityData } from '@multiplayer/types'
import { BlocknoteTemplates } from '../../templates'
import { BlocknoteEnvironmentSetters } from './blocknote-environment.setters'
import { Setters } from '../'

type PartialBlocknoteData = Omit<Blocknote.Data, keyof EntityData | 'type' | 'content'>

export class BlocknoteSetters implements Setters<PartialBlocknoteData> {
  yEnvironments: Y.Map<unknown>

  constructor(doc: Y.Doc) {
    this.yEnvironments = doc.getMap('environments')
  }

  setEnvironments(data: PartialBlocknoteData) {
    const empty = BlocknoteTemplates.empty()
    const environments = data.environments || empty.environments

    Object.keys(environments).forEach(envKey=> {
      const envData = environments[envKey]
      const map = new Y.Map<unknown>()
      this.yEnvironments.set(envKey, map)
      const envSetter = new BlocknoteEnvironmentSetters(map)
      envSetter.setFields(envData)
    })
  }

  setFields(data: PartialBlocknoteData) {
    this.setEnvironments(data)
  }
}
