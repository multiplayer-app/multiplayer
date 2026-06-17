export interface BaseYjsUpdate {
  _id: string
  owner?: string
  update?: Uint8Array
  status?: YjsUpdateStatus
  key?: string
  bucket?: string
  createdAt: string
}

export enum YjsUpdateStatus {
  DONE = 'DONE',
  IN_PROGRESS = 'IN_PROGRESS'
}