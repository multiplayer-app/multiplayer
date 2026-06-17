import * as Y from 'yjs'
import { Blocknote } from '@multiplayer/types'

export function migrateBlocknoteToV3(doc: Y.Doc) {
  (doc.getMap('environments').get(Blocknote.SourceEnv.GLOBAL) as Y.Map<any>)
    .set('secrets', new Y.Array())
}