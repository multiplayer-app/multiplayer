import { DEFAULT_LAYOUT } from '@multiplayer/types'
import * as Y from 'yjs'

export function migratePlatformToV4(doc: Y.Doc) {
  const yMap = doc.getMap('object')
  const metadata = yMap.has('metadata') ? yMap.get('metadata') as Y.Map<unknown>: new Y.Map<unknown>()
  const currentMode = metadata.get('layout')
  metadata.set('layout', { ...DEFAULT_LAYOUT, mode: currentMode })
}
