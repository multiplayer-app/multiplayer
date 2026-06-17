import { WarningEventsServerMap } from './warning-events'
import { IEntity } from '../entity'

export enum YjsEvents {
  SYNC_INIT = 'sync-init',
  SYNC_INIT_2 = 'sync-init-2',
  SYNC_STEP_1 = 'sync-step-1',
  SYNC_STEP_2 = 'sync-step-2',
  SYNC_UPDATE = 'sync-update',
  SYNC_UPDATE_URL = 'sync-update-url',
  SYNC_UPDATE_URL_DONE = 'sync-update-url-done',
  AWARENESS_UPDATE = 'awareness-update',
  DESTROY_DOC = 'destroy-doc',
  ERROR = 'error',
  META_REFRESH = 'meta-refresh',
}

export type YjsEventsMap = {
  [YjsEvents.SYNC_STEP_1]: (stateVector: Uint8Array) => void
  [YjsEvents.SYNC_UPDATE]: (update: Uint8Array, callback?: () => void) => void
  [YjsEvents.AWARENESS_UPDATE]: (update: Uint8Array) => void
  [YjsEvents.SYNC_UPDATE_URL]: (callback: (id: string) => void) => void
  [YjsEvents.SYNC_UPDATE_URL_DONE]: (id: string) => void
} & WarningEventsServerMap

export type YjsServerEventsMap = {
  [YjsEvents.SYNC_INIT]: (callback: (vectorState: Uint8Array) => void) => void
  [YjsEvents.SYNC_INIT_2]: (update: Uint8Array | undefined) => void
  [YjsEvents.SYNC_STEP_1]: (stateVector: Uint8Array, syncStep2: (update: Uint8Array) => void) => void
  [YjsEvents.SYNC_STEP_2]: (update: Uint8Array | undefined) => void
  [YjsEvents.SYNC_UPDATE]: (update: Uint8Array) => void
  [YjsEvents.SYNC_UPDATE_URL_DONE]: (ids: string[]) => void
  [YjsEvents.AWARENESS_UPDATE]: (update: Uint8Array) => void
  [YjsEvents.DESTROY_DOC]: () => void
  [YjsEvents.ERROR]: (error: any) => void
  [YjsEvents.META_REFRESH]: (entity: IEntity, timestamp: number) => void
} & WarningEventsServerMap
