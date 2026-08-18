// checkpointActiveDebugSessionsToS3 (debug-session.worker.ts) runs on graceful
// shutdown to safety-copy any not-yet-transferred session's data to S3, since DuckDB's
// local file is otherwise the only copy. Two things matter most: (1) a still-active
// session gets a real S3 copy without being marked finishedS3Transfer (the eventual
// real move at actual stop time must still happen), while a stopped-but-untransferred
// one does get marked finished; (2) it only runs on a replica that actually holds
// local data (leader, or single-replica 'idle') - a follower must not touch anything.
jest.mock('../src/store/leader-election', () => ({
  isLeader: jest.fn().mockReturnValue(false),
  getState: jest.fn().mockReturnValue('idle'),
}))

import mongo from '@multiplayer/mongo'
import { DebugSessionModel } from '@multiplayer/models'
import { SessionType } from '@multiplayer-app/session-recorder-node'
import { ObjectId } from '@multiplayer/mongo'
import { duckdbStore } from '../src/store/duckdb/duckdb.store'
import * as StoreLeaderElection from '../src/store/leader-election'
import { checkpointActiveDebugSessionsToS3 } from '../src/worker/debug-session.worker'

const WORKSPACE_ID = new ObjectId()
const PROJECT_ID = new ObjectId()

// moveDebugSessionDataFromChToS3 records an s3Files entry for every data type
// regardless of row count (empty tables get a real, readable empty-array object - see
// move-to-s3-empty-tables.test.ts), so no fixture data is needed here to observe a
// checkpoint's effect.
const createSession = (overrides: Partial<Record<string, any>> = {}) => DebugSessionModel.createDebugSession({
  sessionType: SessionType.MANUAL,
  workspace: WORKSPACE_ID,
  project: PROJECT_ID,
  startedAt: new Date(),
  ...overrides,
})

beforeAll(async () => {
  await mongo.connect()
  await duckdbStore.connect()
})

afterAll(async () => {
  await DebugSessionModel.deleteMany({ workspace: WORKSPACE_ID })
  await duckdbStore.disconnect()
  await mongo.disconnect()
})

describe('checkpointActiveDebugSessionsToS3', () => {
  it('copies a still-active session to S3 without marking it finished, and marks a stopped-but-untransferred one finished', async () => {
    const activeSession = await createSession()
    const stoppedSession = await createSession({ stoppedAt: new Date() })

    await checkpointActiveDebugSessionsToS3()

    const refreshedActive = await DebugSessionModel.findDebugSessionById(activeSession._id)
    const refreshedStopped = await DebugSessionModel.findDebugSessionById(stoppedSession._id)

    expect(refreshedActive?.s3Files?.length).toBeGreaterThan(0)
    expect(refreshedActive?.finishedS3Transfer).not.toBe(true)

    expect(refreshedStopped?.s3Files?.length).toBeGreaterThan(0)
    expect(refreshedStopped?.finishedS3Transfer).toBe(true)
  })

  it('does nothing when this replica is not leader and not single-replica idle', async () => {
    jest.mocked(StoreLeaderElection.isLeader).mockReturnValue(false)
    jest.mocked(StoreLeaderElection.getState).mockReturnValue('follower')

    const session = await createSession()

    await checkpointActiveDebugSessionsToS3()

    const refreshed = await DebugSessionModel.findDebugSessionById(session._id)

    expect(refreshed?.s3Files?.length || 0).toBe(0)
    expect(refreshed?.finishedS3Transfer).not.toBe(true)

    jest.mocked(StoreLeaderElection.getState).mockReturnValue('idle')
  })
})
