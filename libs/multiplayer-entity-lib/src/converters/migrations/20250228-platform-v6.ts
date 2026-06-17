import * as Y from 'yjs'
import { BlocknoteHelper } from '../../helpers/blocknote.helper'
import { EntityVisibility } from '@multiplayer/types'

export function migratePlatformToV6(doc: Y.Doc) {
  const readme = doc.getXmlFragment('readme')
  const description = doc.getXmlFragment('description')
  const metadata = doc.getMap('object').get('metadata') as Y.Map<any>
  const info = doc.getMap('information')
  description.push([BlocknoteHelper.convertJsonToYXml(BlocknoteHelper.convertYXmlFragmentToJson(readme))])

  info.set('visibility', metadata.get('visibility') || EntityVisibility.PRIVATE)
  info.set('shortDescription', metadata.get('description') || '')
}
