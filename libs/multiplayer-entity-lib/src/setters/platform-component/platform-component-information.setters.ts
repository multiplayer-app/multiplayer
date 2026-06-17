import { Setters } from '../setters'
import { PlatformComponentInformation } from '@multiplayer/types'
import * as Y from 'yjs'

export class PlatformComponentInformationSetters implements Setters<PlatformComponentInformation> {
  private yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  setType(data: PlatformComponentInformation) {
    this.yMap.set('type', data.type)
  }
  setVisibility(data: PlatformComponentInformation) {
    this.yMap.set('visibility', data.visibility)
  }
  setOwner(data: PlatformComponentInformation) {
    this.yMap.set('owner', data.owner)
  }
  setSlug(data: PlatformComponentInformation) {
    this.yMap.set('slug', data.slug)
  }
  setShortDescription(data: PlatformComponentInformation) {
    this.yMap.set('shortDescription', data.shortDescription)
  }
  setColor(data: PlatformComponentInformation) {
    this.yMap.set('color', data.color)
  }
  setIconUrl(data: PlatformComponentInformation) {
    this.yMap.set('iconUrl', data.iconUrl)
  }

  setFields(data): void {
    this.setType(data)
    this.setVisibility(data)
    this.setOwner(data)
    this.setSlug(data)
    this.setShortDescription(data)
    this.setColor(data)
    this.setIconUrl(data)
  }
}
