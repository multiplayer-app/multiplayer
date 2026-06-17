import { EntityData } from './entity-data'

export interface ExcalidrawData extends EntityData {
  elements: Record<string, any>[] // todo: reuse excalidraw types if needed
  files: Record<string, BinaryFileData>
}
export type BinaryFileData = {
  mimeType: string
  id: string
  dataURL: string
  created: number;
  lastRetrieved?: number;
}
