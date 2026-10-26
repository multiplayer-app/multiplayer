import { DebugSessionModel, IssueModel } from '@multiplayer/models'
import {
  MULTIPLAYER_TRACE_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_SESSION_PREFIX,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_CLIENT_ID_LENGTH,
  MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH,
} from '@multiplayer-app/session-recorder-node'
import type { IDebugSession, ITraceResolution } from '@multiplayer/types'
import * as DebugSessionService from './debug-session.service'

// More would not help anyone choose; a trace id normally names one session
const MAX_SESSIONS = 5

const SESSION_FIELDS = {
  name: 1,
  sessionType: 1,
  createdAt: 1,
  startedAt: 1,
  stoppedAt: 1,
  issues: 1,
}

type FoundSession = Pick<IDebugSession, '_id' | 'name' | 'sessionType' | 'createdAt' | 'startedAt' | 'stoppedAt' | 'issues'>

// Trace ids recorded in a session embed its short id after the prefix (and, for SESSION
// recordings, after the client id). Continuous recordings embed the continuous session's id,
// which the sessions saved from it reference.
const getSessionIdsFromTraceId = (traceId: string): { shortId?: string, continuousShortId?: string } => {
  const read = (start: number) => traceId.substring(start, start + MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH)

  if (traceId.startsWith(MULTIPLAYER_TRACE_DEBUG_PREFIX)) {
    return { shortId: read(MULTIPLAYER_TRACE_DEBUG_PREFIX.length) }
  }
  if (traceId.startsWith(MULTIPLAYER_TRACE_SESSION_PREFIX)) {
    return { shortId: read(MULTIPLAYER_TRACE_SESSION_PREFIX.length + MULTIPLAYER_TRACE_CLIENT_ID_LENGTH * 2) }
  }
  if (traceId.startsWith(MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX)) {
    return { continuousShortId: read(MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX.length) }
  }

  return {}
}

// Trace ids of SESSION recordings, and of the traces a client buffers before one starts, embed the
// client's id
const hasClientId = (traceId: string) => traceId.startsWith(MULTIPLAYER_TRACE_SESSION_PREFIX)
  || traceId.startsWith(MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX)

const findSessions = (filter: object): Promise<FoundSession[]> => DebugSessionModel
  .find(filter, SESSION_FIELDS)
  .sort({ createdAt: -1 })
  .limit(MAX_SESSIONS)
  .lean() as unknown as Promise<FoundSession[]>

/**
 * The sessions and issues a trace is known as in a project. Exact sources only: the error spans
 * the issue pipeline attached to sessions, and the session id embedded in recorded trace ids. A
 * trace that was neither recorded in a session nor failed is not stored, so it resolves to nothing.
 */
export const resolveTrace = async (
  workspaceId: string,
  projectId: string,
  rawTraceId: string,
): Promise<ITraceResolution> => {
  const traceId = rawTraceId.toLowerCase()
  const scope = { workspace: workspaceId, project: projectId }
  const { shortId, continuousShortId } = getSessionIdsFromTraceId(traceId)

  const [withErrorSpans, byShortId, byContinuousSession, liveSessionId] = await Promise.all([
    findSessions({ ...scope, 'issues.traceId': traceId }),
    shortId ? findSessions({ ...scope, shortId }) : [],
    continuousShortId ? findSessions({ ...scope, continuousDebugSession: continuousShortId }) : [],
    // Traces recorded before a session exists (the replay buffer) are mapped by the client's id,
    // only while it records
    hasClientId(traceId)
      ? DebugSessionService.getDebugSessionIdFromTraceId(workspaceId, projectId, traceId).catch(() => false as const)
      : false as const,
  ])

  const liveSessions = liveSessionId && ![...withErrorSpans, ...byShortId, ...byContinuousSession]
    .some(({ _id }) => String(_id) === String(liveSessionId))
    ? await findSessions({ ...scope, _id: liveSessionId })
    : []

  // Most certain first: sessions holding the trace's error spans, then the session its id names, then
  // the client's current session (for buffered traces, it may have started after the trace)
  const certainIds = new Set([...withErrorSpans, ...byShortId].map(({ _id }) => String(_id)))
  const sessions = new Map<string, FoundSession>()
  for (const session of [...withErrorSpans, ...byShortId, ...liveSessions, ...byContinuousSession]) {
    sessions.set(String(session._id), sessions.get(String(session._id)) || session)
  }

  const traceIssues = withErrorSpans.flatMap(({ issues }) => (issues || []).filter(issue => issue.traceId === traceId))
  const issueHashes = [...new Set(traceIssues.map(({ issueHash }) => issueHash))]
  const issues = issueHashes.length
    ? await IssueModel.find(
      { ...scope, hash: { $in: issueHashes } },
      { title: 1, hash: 1, titleHash: 1, componentHash: 1, resolved: 1, archived: 1 },
    ).lean()
    : []

  return {
    traceId,
    sessions: [...sessions.values()].slice(0, MAX_SESSIONS).map(({ issues: sessionIssues, ...session }) => ({
      ...session,
      _id: String(session._id),
      certain: certainIds.has(String(session._id)),
      spanIds: [...new Set((sessionIssues || []).filter(issue => issue.traceId === traceId).map(({ spanId }) => spanId))],
    })),
    issues: (issues as any[]).map(({ _id, ...issue }) => issue),
  }
}
