import { EntityData } from './entity-data'

export interface SourceData extends EntityData {
  extension: string
  contents: string
}
