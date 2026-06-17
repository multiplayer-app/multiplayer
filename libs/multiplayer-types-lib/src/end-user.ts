import {
  EndUserType,
  SessionRecordingNextRecordType,
  EndUserState,
  SessionRecordingMode,
  MetricName,
} from './enums'
import { IRecordingOptions } from './recording-options'
import { IEndUserAttributes } from './EndUserAttributes'

export interface IEndUser {
  _id: string
  workspace: string
  project: string

  hash: string

  attributes: IEndUserAttributes

  lastSeen: string | Date

  connections: {
    socketId: string
    clientId?: string
    state: EndUserState
    recordingMode?: SessionRecordingMode
    sessionRecording?: string
  }[]

  metrics?: {
    [MetricName.ISSUE_RATE]?: { time: string, value: number }[]
    [MetricName.SESSION_RECORDING_RATE]?: { time: string, value: number }[]
  }

  conditionalRecordingSettings: {
    recordingOptions?: IRecordingOptions
    whenToRecord?: SessionRecordingNextRecordType
    sessionRecordingsLimit?: number
    sessionRecordingsCount: number
  }

  online: boolean

  createdAt: string | Date
  updatedAt: string | Date
}
