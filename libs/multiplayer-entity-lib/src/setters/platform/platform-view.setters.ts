import * as Y from 'yjs'
import { Setters } from '../setters'
import { NodeState, View } from '@multiplayer/types'

export class PlatformViewSetters implements Setters<View> {
  yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  setId(data: View) {
    this.yMap.set('id', data.id)
  }

  setName(data: View) {
    this.yMap.set('name', data.name)
  }

  setComponents(data: View) {
    const components = new Y.Array<string>()
    if (data.components) {
      components.push(data.components)
    }
    this.yMap.set('components', components)
  }

  setGroups(data: View) {
    const groups = new Y.Array<string>()
    if (data.groups) {
      groups.push(data.groups)
    }
    this.yMap.set('groups', groups)
  }

  addPosition(nodeId: string, state: NodeState) {
    const visualizations: Y.Map<unknown> =
      (this.yMap.get('visualizations') as Y.Map<unknown>) ||
      new Y.Map<unknown>()
    Array.from(visualizations.keys()).forEach((visType) => {
      const vis = visualizations.get(visType) as Y.Map<unknown>
      if (vis.has(nodeId)) return
      const stateMap = new Y.Map()
      Object.keys(state).forEach((key) => {
        stateMap.set(key, state[key])
      })
      vis.set(nodeId, stateMap)
    })
  }

  setVisualizations(data: View) {
    const visualizations: Y.Map<unknown> =
      (this.yMap.get('visualizations') as Y.Map<unknown>) ||
      new Y.Map<unknown>()
    Object.keys(data.visualizations).forEach((type: string) => {
      const vis = data.visualizations[type]
      const vizDataMap = new Y.Map<unknown>()
      Object.keys(vis).forEach((id: string) => {
        const vizMap = new Y.Map<unknown>()
        Object.keys(vis[id]).forEach((key) => {
          vizMap.set(key, vis[id][key])
        })
        vizDataMap.set(id, vizMap)
      })
      visualizations.set(type, vizDataMap)
    })
    this.yMap.set('visualizations', visualizations)
  }

  setFields(data: View) {
    this.setId(data)
    this.setName(data)
    this.setGroups(data)
    this.setComponents(data)
    this.setVisualizations(data)
  }
}
