import * as Y from 'yjs'
import { Setters } from '../setters'
import {
  PlatformMetadata,
  DEFAULT_LAYOUT,
} from '@multiplayer/types'

export class PlatformMetadataSetters implements Setters<PlatformMetadata> {
  yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  setDefaultView(data: PlatformMetadata) {
    this.yMap.set('defaultView', data.defaultView || '_all')
  }

  setLayout(data: PlatformMetadata) {
    this.yMap.set('layout', { ...DEFAULT_LAYOUT, ...(data.layout || {}) })
  }

  setFields(data: PlatformMetadata): void {
    this.setLayout(data)
    this.setDefaultView(data)
  }
}
