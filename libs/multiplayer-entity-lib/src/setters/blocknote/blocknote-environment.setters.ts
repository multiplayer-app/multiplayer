import * as Y from 'yjs'
import { Setters } from '../setters'
import { Blocknote } from '@multiplayer/types'


export class BlocknoteEnvironmentSetters implements Setters<Blocknote.EnvData> {
  yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  setSecrets(data: Blocknote.EnvData) {
    const yVariables = new Y.Array<Blocknote.AggregateVariable>()
    this.yMap.set('secrets', yVariables)
    yVariables.insert(0, data.secrets)
  }
  setVariables(data: Blocknote.EnvData) {
    const yVariables = new Y.Array<Blocknote.AggregateVariable>()
    this.yMap.set('variables', yVariables)
    yVariables.insert(0, data.variables)
  }

  setFields(data: Blocknote.EnvData) {
    this.setVariables(data)
    this.setSecrets(data)
  }
}
