import { IDebugSession } from '@multiplayer/types'

export interface IContinuousDebugSession {
  workspace: string,
  project: string,
  debugSessionData?: Partial<IDebugSession>
  startedAt: Date,
}
