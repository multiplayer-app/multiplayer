import { EntityData } from './entity-data'

export interface SketchData extends EntityData {
  tldrawFileFormatVersion: number
  schema: Record<string, unknown>
  records: { id: string, typeName: string }[]
}
