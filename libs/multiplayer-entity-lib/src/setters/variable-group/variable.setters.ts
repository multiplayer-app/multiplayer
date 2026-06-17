import * as Y from 'yjs'
import { Setters } from '../setters'
import { Variable } from '@multiplayer/types'

export class VariableSetters implements Setters<Variable> {
  private dataMap: Y.Map<unknown>

  constructor(dataMap: Y.Map<unknown>) {
    this.dataMap = dataMap
  }

  setName(data: Variable) {
    this.dataMap.set('name', data.name || '')
  }
  setId(data: Variable) {
    this.dataMap.set('id', data.id || '')
  }
  setValue(data: Variable) {
    if (!data.value) return
    this.dataMap.set('value', data.value)
  }
  setSecret(data: Variable) {
    this.dataMap.set('secret', data.secret || false)
  }
  setDescription(data: Variable) {
    this.dataMap.set('description', data.description || '')
  }

  setFields(data: Variable): void {
    this.setId(data)
    this.setName(data)
    this.setValue(data)
    this.setSecret(data)
    this.setDescription(data)
  }
}