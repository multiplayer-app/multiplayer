import { EntityType } from '@multiplayer/types'
import { EntityDocument } from './entity-document'
import { PlatformComponentDocument } from './platform-component.document'
import { PlatformDocument } from './platform.document'
import { ApiDocument } from './api.document'

export class DocumentHelper {
  static getDocumentConstructorByEntityType(entityType: EntityType): typeof EntityDocument {
    const custom = {
      [EntityType.PLATFORM_COMPONENT]: PlatformComponentDocument,
      [EntityType.PLATFORM]: PlatformDocument,
      [EntityType.API]: ApiDocument,
    }
    return custom[entityType] || EntityDocument
  }
}
