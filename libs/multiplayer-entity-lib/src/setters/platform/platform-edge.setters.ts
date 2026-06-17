import * as Y from 'yjs'
import { Setters } from '../setters'
import { Edge } from '@multiplayer/types'

export class PlatformEdgeSetters implements Setters<Edge> {
  yMap: Y.Map<string>

  constructor(yMap: Y.Map<string>) {
    this.yMap = yMap
  }

  setId (data: Edge) {
    this.yMap.set('id', data.id)
  }

  getSource () {
    return this.yMap.get('source')
  }

  getDetectionId () {
    return this.yMap.get('detectionId')
  }

  setSource (data: Edge) {
    this.yMap.set('source', data.source)
  }

  setSourcePosition (data: Edge) {
    if (data.sourcePosition) {
      this.yMap.set('sourcePosition', data.sourcePosition)
    }
  }

  getTarget () {
    return this.yMap.get('target')
  }

  setTarget (data: Edge) {
    this.yMap.set('target', data.target)
  }

  setTargetPosition (data: Edge) {
    if (data.targetPosition) {
      this.yMap.set('targetPosition', data.targetPosition)
    }
  }

  setLabel (data: Edge) {
    if (data.label) {
      this.yMap.set('label', data.label)
    }
  }

  setDetectionId (data: Edge) {
    if (data.detectionId) {
      this.yMap.set('detectionId', data.detectionId)
    }
  }

  setFields (data: Edge) {
    this.setId(data)
    this.setSource(data)
    this.setTarget(data)
    this.setLabel(data)
    this.setSourcePosition(data)
    this.setTargetPosition(data)
    this.setDetectionId(data)
  }
}
