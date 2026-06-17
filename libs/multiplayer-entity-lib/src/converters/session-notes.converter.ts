import * as Y from 'yjs'
import { DataProcessors, YjsConverter } from './yjs-converter'
import { SessionNoteData } from '@multiplayer/types'
import { SessionNotesTemplates } from '../templates'
import { BlocknoteHelper } from '../helpers'
import { TipTapToMarkdown } from '../importers/markdown'

class SessionNotesConverter implements YjsConverter<SessionNoteData> {
  stringify(data: SessionNoteData, dataProcessors: DataProcessors): string {
    return new TipTapToMarkdown(dataProcessors).convertDocToMarkdown(data)
  }

  convertDataToYDoc (data: SessionNoteData = SessionNotesTemplates.empty()): Y.Doc {
    const doc = new Y.Doc()
    doc.getXmlFragment('xml').push([BlocknoteHelper.convertJsonToYXml(data)])
    return doc
  }
  convertYDocToData(doc: Y.Doc): SessionNoteData {
    const xml = doc.getXmlFragment('xml')
    return BlocknoteHelper.convertYXmlFragmentToJson(xml)
  }
}
export default new SessionNotesConverter()
