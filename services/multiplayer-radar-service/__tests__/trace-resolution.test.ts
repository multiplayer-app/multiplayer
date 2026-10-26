import crypto from 'crypto'
import mongo, { ObjectId } from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import { DebugSessionModel, IssueModel } from '@multiplayer/models'
import { IssueCategoryEnum } from '@multiplayer/types'
import {
  SessionType,
  MULTIPLAYER_TRACE_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_SESSION_PREFIX,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX,
} from '@multiplayer-app/session-recorder-node'
import * as TraceResolutionService from '../src/services/trace-resolution.service'
import * as DebugSessionService from '../src/services/debug-session.service'
import { ClientIdDebugSessionCache } from '../src/cache'
import { TraceSchema } from '../src/middleware/validation/schema'

// Links from external tools (Grafana) name a trace id; it resolves to the sessions it was recorded
// in and the issues its errors raised - long after the recording ended.

const WORKSPACE_ID = new ObjectId().toString()
const PROJECT_ID = new ObjectId().toString()
const OTHER_PROJECT_ID = new ObjectId().toString()

const hex = (length: number) => crypto.randomBytes(length).toString('hex').slice(0, length)
// A 32 hex characters trace id, completed with random characters
const traceIdOf = (head = '') => `${head}${hex(32 - head.length)}`

const createSession = (fields: Record<string, unknown> = {}) => DebugSessionModel.create({
  workspace: WORKSPACE_ID,
  project: PROJECT_ID,
  shortId: hex(8),
  sessionType: SessionType.MANUAL,
  name: 'Checkout session',
  startedAt: new Date(),
  ...fields,
})

const errorSpanOf = (traceId: string, issueHash: string, spanId = hex(16)) => ({
  issueHash,
  issueTitleHash: `${issueHash}-title`,
  issueComponentHash: `${issueHash}-component`,
  traceId,
  spanId,
})

const resolve = (traceId: string, projectId = PROJECT_ID) => TraceResolutionService.resolveTrace(WORKSPACE_ID, projectId, traceId)
const sessionIds = ({ sessions }: { sessions: { _id: string }[] }) => sessions.map(({ _id }) => String(_id))
const certainty = ({ sessions }: { sessions: { certain: boolean }[] }) => sessions.map(({ certain }) => certain)

beforeAll(async () => {
  await mongo.connect()
  await redis.connect()
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(async () => {
  await Promise.all([
    DebugSessionModel.deleteMany({ workspace: WORKSPACE_ID }),
    IssueModel.deleteMany({ workspace: WORKSPACE_ID }),
  ])
  await mongo.disconnect()
  await redis.disconnect()
})

describe('Trace resolution', () => {
  it('finds the session and the issue of an error trace outside any recording', async () => {
    const traceId = traceIdOf()
    const issueHash = hex(32)
    const spanId = hex(16)
    const session = await createSession({ issues: [errorSpanOf(traceId, issueHash, spanId)] })
    await IssueModel.create({
      workspace: WORKSPACE_ID,
      project: PROJECT_ID,
      hash: issueHash,
      titleHash: `${issueHash}-title`,
      componentHash: `${issueHash}-component`,
      title: 'Order service unavailable',
      category: IssueCategoryEnum.EXCEPTION,
      service: { serviceName: 'checkout', serviceNameSlug: 'checkout' },
    })

    const resolution = await resolve(traceId.toUpperCase())

    expect(resolution.traceId).toBe(traceId)
    expect(sessionIds(resolution)).toEqual([String(session._id)])
    expect(certainty(resolution)).toEqual([true])
    expect(resolution.sessions[0].spanIds).toEqual([spanId])
    expect(resolution.issues).toEqual([expect.objectContaining({ title: 'Order service unavailable', titleHash: `${issueHash}-title` })])
  })

  it('finds the session a recorded trace id names, after the recording ended', async () => {
    const session = await createSession()

    const resolution = await resolve(traceIdOf(`${MULTIPLAYER_TRACE_DEBUG_PREFIX}${session.shortId}`))

    expect(sessionIds(resolution)).toEqual([String(session._id)])
    expect(certainty(resolution)).toEqual([true])
    expect(resolution.sessions[0].spanIds).toEqual([])
  })

  it('reads the session id after the client id in session recordings', async () => {
    const session = await createSession({ sessionType: SessionType.SESSION })

    const resolution = await resolve(traceIdOf(`${MULTIPLAYER_TRACE_SESSION_PREFIX}${hex(8)}${session.shortId}`))

    expect(sessionIds(resolution)).toEqual([String(session._id)])
    expect(certainty(resolution)).toEqual([true])
  })

  it('offers every session saved from a continuous recording, as one that may hold the trace', async () => {
    const continuousShortId = hex(8)
    const first = await createSession({ sessionType: SessionType.CONTINUOUS, continuousDebugSession: continuousShortId })
    const second = await createSession({ sessionType: SessionType.CONTINUOUS, continuousDebugSession: continuousShortId })

    const resolution = await resolve(traceIdOf(`${MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX}${continuousShortId}`))

    expect(sessionIds(resolution).sort()).toEqual([String(first._id), String(second._id)].sort())
    // A save covers a window of the recording, which may not be the trace's
    expect(certainty(resolution)).toEqual([false, false])
  })

  it('offers the client\'s current session for a trace buffered before it, as one that may hold the trace', async () => {
    const session = await createSession({ sessionType: SessionType.SESSION })
    const clientId = hex(8)
    await ClientIdDebugSessionCache.set(WORKSPACE_ID, PROJECT_ID, clientId, String(session._id))

    const resolution = await resolve(traceIdOf(`${MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX}${clientId}`))

    expect(sessionIds(resolution)).toEqual([String(session._id)])
    expect(certainty(resolution)).toEqual([false])
  })

  it('looks the client\'s current session up only for trace ids that embed a client id', async () => {
    const liveLookup = jest.spyOn(DebugSessionService, 'getDebugSessionIdFromTraceId')

    await resolve(traceIdOf())
    await resolve(traceIdOf(`${MULTIPLAYER_TRACE_DEBUG_PREFIX}${hex(8)}`))
    await resolve(traceIdOf(`${MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX}${hex(8)}`))
    expect(liveLookup).not.toHaveBeenCalled()

    await resolve(traceIdOf(`${MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX}${hex(8)}`))
    await resolve(traceIdOf(`${MULTIPLAYER_TRACE_SESSION_PREFIX}${hex(16)}`))
    expect(liveLookup).toHaveBeenCalledTimes(2)
  })

  it('ranks a session holding an error span of the trace above one its id names', async () => {
    // Short ids repeat across a project's history; an error span is certain
    const named = await createSession()
    const traceId = traceIdOf(`${MULTIPLAYER_TRACE_DEBUG_PREFIX}${named.shortId}`)
    const withError = await createSession({ issues: [errorSpanOf(traceId, hex(32))] })

    const resolution = await resolve(traceId)

    expect(sessionIds(resolution)).toEqual([String(withError._id), String(named._id)])
    expect(certainty(resolution)).toEqual([true, true])
  })

  it('stays within the project', async () => {
    const traceId = traceIdOf()
    await createSession({ project: OTHER_PROJECT_ID, issues: [errorSpanOf(traceId, hex(32))] })

    expect(await resolve(traceId)).toEqual({ traceId, sessions: [], issues: [] })
  })

  it('resolves a trace it never stored to nothing', async () => {
    const traceId = traceIdOf()

    expect(await resolve(traceId)).toEqual({ traceId, sessions: [], issues: [] })
  })

  it('accepts only trace ids', () => {
    const validate = (traceId: string) => TraceSchema.resolveTraceSchema.validate({
      params: { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, traceId },
    }).error

    expect(validate(traceIdOf())).toBeUndefined()
    expect(validate(traceIdOf().toUpperCase())).toBeUndefined()
    expect(validate('not-a-trace-id')).toBeDefined()
    expect(validate(hex(16))).toBeDefined()
  })
})
