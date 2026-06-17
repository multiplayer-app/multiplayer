import * as Y from 'yjs'
import BlocknoteConverter from '../blocknote.converter'
import * as BlocknoteTemplates from '../../templates/blocknote.template'
import { BlocknoteHelper } from '../../helpers/blocknote.helper'

export function migratePlatformToV3(doc: Y.Doc) {
  const readme = doc.getXmlFragment('readme')
  readme.push([BlocknoteHelper.convertJsonToYXml(BlocknoteTemplates.docTemplate())])
}
