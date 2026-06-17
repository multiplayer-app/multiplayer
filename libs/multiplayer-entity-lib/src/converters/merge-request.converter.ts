import * as Y from 'yjs'
import { YjsConverter } from './yjs-converter'

interface MergeRequestResolution {
  workspaceUserId: string
  data: { entityCommitId: string } | { patch: object }
}

class MergeRequestConverter implements YjsConverter<Record<string, MergeRequestResolution>> {
  getSummaryFromData(data: Record<string, MergeRequestResolution>): Record<string, any> {
    return {}
  }
  applyDocumentMigration(doc: Y.Doc) {}
  convertDataToYDoc (data: Record<string, MergeRequestResolution> = {}): Y.Doc {
    const doc = new Y.Doc()
    const resolutions = doc.getMap<MergeRequestResolution>('resolutions')
    Object.keys(data).forEach((key) => {
      resolutions.set(key, data[key])
    })
    return doc
  }
  convertYDocToData(doc: Y.Doc): Record<string, MergeRequestResolution> {
    return {
      ...doc.getMap('resolutions').toJSON(),
    }
  }
}
export default new MergeRequestConverter()
