import * as Y from 'yjs'
import { Setters } from '../setters'
import { PlatformRadarData } from '@multiplayer/types'

export class PlatformRadarSetters implements Setters<PlatformRadarData> {
  yMap: Y.Map<unknown>

  constructor(yMap: Y.Map<unknown>) {
    this.yMap = yMap
  }

  setEnabled(data: PlatformRadarData) {
    this.yMap.set('enabled', data.enabled ?? true)
  }

  setLinkEnabled(data: PlatformRadarData) {
    this.yMap.set('linkEnabled', data.linkEnabled ?? true)
  }

  setIgnoredDetections(data: PlatformRadarData) {
    this.yMap.set('ignoredDetections', data.ignoredDetections || [])
  }

  setFields(data: PlatformRadarData): void {
    this.setEnabled(data)
    this.setLinkEnabled(data)
    this.setIgnoredDetections(data)
  }
}
