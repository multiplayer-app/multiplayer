import { IDebugSession } from './debug-session'
import { IIssue } from './issue'

// What a trace id is known as in a project: the sessions it was recorded in and the issues its
// spans raised
export interface ITraceResolution {
  traceId: string
  sessions: (Pick<IDebugSession, '_id' | 'name' | 'sessionType' | 'createdAt' | 'startedAt' | 'stoppedAt'> & {
    // Whether the trace is known to be in the session: it holds the trace's error spans, or the
    // trace id names it. Otherwise the session may hold the trace - the client's current session,
    // for a trace buffered before it started, or a save of the continuous recording the trace was in.
    certain: boolean
    // Spans of the trace known to be in the session (its errors)
    spanIds: string[]
  })[]
  issues: Pick<IIssue, 'title' | 'hash' | 'titleHash' | 'componentHash' | 'resolved' | 'archived'>[]
}
