import { VisualizationType, DEFAULT_VIEW } from '@multiplayer/types'
import * as Y from 'yjs'

export function migratePlatformToV5(doc: Y.Doc) {
  const yMap = doc.getMap('object')


  const views$ = yMap.get('views') as Y.Map<any>
  const groups$ = yMap.get('groups') as Y.Map<any>
  const components$ = yMap.get('components') as Y.Map<any>

  views$.forEach((view) => {
    const groupsArr = new Y.Array<string>()
    const componentsArr = new Y.Array<string>()
    const groupsStates = view.get('groups') as Y.Map<any> || new Y.Map<unknown>()
    const visualization = view.get('visualizations') as Y.Map<any>
    const states = visualization.get(VisualizationType.DIAGRAM) as Y.Map<any>
    const isCustomView = view.get('id') !== DEFAULT_VIEW

    states.forEach((_, id)=>{
      if (!components$.has(id)) {
        states.delete(id)
        return
      }
      if (isCustomView) {
        componentsArr.insert(0, [id])
      }
    })

    groupsStates.forEach((group, id)=> {
      if (!groups$.has(id)) {
        return
      }
      if (isCustomView) {
        groupsArr.insert(0, [id])
      }

      states.set(id, group.clone())
    })

    view.set('groups', groupsArr)
    view.set('components', componentsArr)
  })
}
