import {
  RemoteSessionRecordingConditionCompareOperator,
  SessionRecordingMode,
} from './enums'
import { IRecordingOptions } from './recording-options'

export interface IConditionalRecordingFilters {
  _id: string
  workspace: string
  project: string

  name: string
  description?: string
  enabled: boolean

  samplingRate: number

  mode: SessionRecordingMode

  conditions: {
    start: {
      // expr?: string // use js like syntax

      attributePath: string
      value?: string,
      conditionType: RemoteSessionRecordingConditionCompareOperator
    }[],

    stop: {
      // at least one of:
      idleTime?: number // time in ms
      maxTime?: number // time in ms
    },

  }
  recordingOptions?: IRecordingOptions

  createdAt: string | Date
  updatedAt: string | Date
}
