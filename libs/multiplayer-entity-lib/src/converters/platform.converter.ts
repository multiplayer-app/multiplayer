import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { Platform } from '@multiplayer/types'
import { PlatformSetters } from '../setters'
import { PlatformTemplates } from '../templates'
import { Doc } from 'yjs'
import { migratePlatformToV2 } from './migrations/20240422-platform-v2'
import { migratePlatformToV3 } from './migrations/20241202-platform-v3'
import { migratePlatformToV4 } from './migrations/20250217-platform-v4'
import { migratePlatformToV5 } from './migrations/20250304-platform-v5'
import { migratePlatformToV6 } from './migrations/20250228-platform-v6'
import { migratePlatformToV7 } from './migrations/20250314-platform-v7'

class PlatformConverter extends YjsEntityConverter<Platform> {
  convertSourceToData(name: string, source: string, extension?: string): Platform {
    return PlatformTemplates.empty(name)
  }
  convertDataToYDoc(data: Platform = PlatformTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)
    const setters = new PlatformSetters(doc)
    setters.setFields(data)
    return doc
  }

  convertYDocToData(doc: Y.Doc): Platform {
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      ...doc.getMap('object').toJSON(),
    } as Platform
  }

  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === PlatformTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }
    if (version === 1) {
      migratePlatformToV2(doc)
      version++
    }
    if (version === 2) {
      migratePlatformToV3(doc)
      version++
    }
    if (version === 3) {
      migratePlatformToV4(doc)
      version++
    }
    if (version === 4) {
      migratePlatformToV5(doc)
      version++
    }
    if (version === 5) {
      migratePlatformToV6(doc)
      version++
    }
    if (version === 6) {
      migratePlatformToV7(doc)
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}

export default new PlatformConverter()
