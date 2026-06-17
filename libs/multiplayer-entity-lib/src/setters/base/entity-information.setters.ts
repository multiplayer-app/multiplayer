import { Setters } from '../setters'
import { EntityInformation } from '@multiplayer/types'
import * as Y from 'yjs'

export class EntityInformationSetters implements Setters<EntityInformation> {
  private yMap: Y.Map<string>

  constructor(yMap: Y.Map<string>) {
    this.yMap = yMap
  }

  setVisibility(data: EntityInformation) {
    this.yMap.set('visibility', data.visibility)
  }
  setShortDescription(data: EntityInformation) {
    this.yMap.set('shortDescription', data.shortDescription)
  }

  setFields(data: EntityInformation): void {
    this.setVisibility(data)
    this.setShortDescription(data)
  }
}
