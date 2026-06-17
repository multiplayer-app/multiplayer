import { VisualizationType } from '@multiplayer/types'
import * as Y from 'yjs'

export function migratePlatformToV7(doc: Y.Doc) {
  const yMap = doc.getMap('object')

  const radar$ = new Y.Map() as Y.Map<any>

  radar$.set('enabled', true)
  radar$.set('linkEnabled', true)
  radar$.set('ignoredDetections', [])

  yMap.set('radar', radar$)

  // Cleanup views to fix the issue with state cleanup
  const groups$ = yMap.get('groups') as Y.Map<any>
  const components$ = yMap.get('components') as Y.Map<any>
  const views$ = yMap.get('views') as Y.Map<any>

  views$.forEach((view$) => {
    const visualizations$ = view$.get('visualizations')
    const states$ = visualizations$.get(VisualizationType.DIAGRAM) as Y.Map<any>

    states$.forEach((_, key) => {
      if (!components$.get(key) && !groups$.get(key)) {
        states$.delete(key)
      }
    })
  })
}
