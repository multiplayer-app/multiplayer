import * as Y from 'yjs'

export function migratePlatformToV2(doc: Y.Doc) {
  const viewsMap: Y.Map<Y.Map<unknown>> = doc.getMap('object').get('views') as Y.Map<Y.Map<unknown>>
  if (!viewsMap) return

  viewsMap.forEach((value) => {
    const diagramMap = (value.get('visualizations') as Y.Map<Y.Map<unknown>>)?.get('diagram')
    if (!diagramMap) return
    Array.from(diagramMap.keys()).forEach((nodeKey) => {
      const nodeData = diagramMap.get(nodeKey)
      if (!nodeData || nodeData instanceof Y.Map) return

      const nodeDataMap = new Y.Map()
      diagramMap.set(nodeKey, nodeDataMap)
      Object.keys(nodeData).forEach((nodeDataKey) => {
        nodeDataMap.set(nodeDataKey, nodeData[nodeDataKey])
      })
    })
  })
}
