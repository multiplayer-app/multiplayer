import * as Y from 'yjs'
import { Setters } from '../setters'
import { Group } from '@multiplayer/types'

export class PlatformGroupSetters implements Setters<Group> {
  yMap: Y.Map<string>

  constructor(yMap: Y.Map<string>) {
    this.yMap = yMap
  }

  setId (data: Group) {
    this.yMap.set('id', data.id)
  }

  setName(data: Group) {
    this.yMap.set('name', data.name)
  }

  setColor(data: Group) {
    this.yMap.set('color', data.color)
  }

  setFields(data: Group) {
    this.setId(data)
    this.setName(data)
    this.setColor(data)
  }
}
