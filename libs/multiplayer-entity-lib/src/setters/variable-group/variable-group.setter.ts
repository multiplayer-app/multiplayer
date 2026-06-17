import * as Y from 'yjs'
import { Setters } from '../setters'
import { Variable, VariableGroup } from '@multiplayer/types'
import { VariableSetters } from './variable.setters'

export class VariableGroupSetters implements Setters<VariableGroup> {
  static GROUPS_KEY = 'groups'
  static VARS_KEY = 'variables'
  private dataMap: Y.Map<unknown>

  constructor(dataMap: Y.Map<unknown>) {
    this.dataMap = dataMap
  }

  getData(): VariableGroup {
    return {
      id: this.getId(),
      name: this.getName(),
      groups: this.getGroups(),
      variables: this.getVariables(),
    }
  }

  getId(): VariableGroup['id'] {
    const id = this.dataMap.get('id')
    if (!id || typeof id !== 'string') {
      return ''
    }

    return id as string
  }

  getName(): VariableGroup['name'] {
    const name = this.dataMap.get('name')
    if (!name || typeof name !== 'string') {
      return ''
    }

    return name
  }

  getGroups(): VariableGroup['groups'] {
    const groups = this.dataMap.get(VariableGroupSetters.GROUPS_KEY)
    if (!groups || !(groups instanceof Y.Map)) return undefined

    return groups.toJSON() as Record<string, VariableGroup>
  }

  getVariables(): VariableGroup['variables'] {
    const vars = this.dataMap.get(VariableGroupSetters.VARS_KEY)
    if (!vars || !(vars instanceof Y.Map)) return undefined

    return vars.toJSON() as Record<string, Variable>
  }

  setFields(data: VariableGroup): void {
    this.setId(data)
    this.setName(data)
    this.setGroups(data)
    this.setVariables(data)
  }

  public setGroups(data: VariableGroup) {
    if (!data.groups) return
    if (!this.dataMap.has(VariableGroupSetters.GROUPS_KEY)) {
      this.dataMap.set(VariableGroupSetters.GROUPS_KEY, new Y.Map())
    }

    const groupsMap = this.dataMap.get(VariableGroupSetters.GROUPS_KEY) as Y.Map<Y.Map<unknown>>

    Object.entries(data.groups).forEach(([key, value]) => {
      if (!groupsMap.has(key)) {
        groupsMap.set(key, new Y.Map())
      }
      const dataMap = groupsMap.get(key) as Y.Map<unknown>
      const setter = new VariableGroupSetters(dataMap)
      setter.setFields(value)
    })
  }

  public setVariables(data: VariableGroup) {
    if (!data.variables) return
    if (!this.dataMap.has(VariableGroupSetters.VARS_KEY)) {
      this.dataMap.set(VariableGroupSetters.VARS_KEY, new Y.Map())
    }

    const varsMap = this.dataMap.get(VariableGroupSetters.VARS_KEY) as Y.Map<Y.Map<unknown>>

    Object.entries(data.variables).forEach(([key, value]) => {
      if (!varsMap.has(key)) {
        varsMap.set(key, new Y.Map())
      }
      const dataMap = varsMap.get(key) as Y.Map<unknown>
      const setter = new VariableSetters(dataMap)
      setter.setFields(value)
    })
  }

  public setName(data: VariableGroup) {
    this.dataMap.set('name', data.name || '')
  }
  public setId(data: VariableGroup) {
    this.dataMap.set('id', data.id || '')
  }
}