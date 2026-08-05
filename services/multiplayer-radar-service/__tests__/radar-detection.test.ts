import mongo from '@multiplayer/mongo'
import { RadarDetectionModel } from '@multiplayer/models'
import { RadarDetectionSource, RadarDetectionType } from '@multiplayer/types'
import * as RadarDetectionService from '../src/services/radar-detection.service'

const WORKSPACE_ID = 'w-detections-1'
const PROJECT_ID = 'p-detections-1'

const baseDetection = {
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  type: RadarDetectionType.ENDPOINT,
  componentName: 'svc-a',
  httpMethod: 'GET',
  httpEndpoint: '/foo',
  componentAliasName: false,
  Timestamp: new Date('2024-01-01T00:00:00Z'),
}

beforeAll(async () => {
  await mongo.connect()
})

afterAll(async () => {
  await RadarDetectionModel.deleteMany({ workspaceId: WORKSPACE_ID })
  await mongo.disconnect()
})

describe('createDetections: atomic RADAR/DOCS upserts converge on one document', () => {
  it('a RADAR-only write leaves a single document with Sign: RADAR', async () => {
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-radar-only',
      collapse_id: 'c-radar-only',
      Sign: RadarDetectionSource.RADAR,
    } as any])

    const detection = await RadarDetectionService.getDetectionById('det-radar-only')
    expect(detection?.Sign).toBe(RadarDetectionSource.RADAR)
  })

  it('a DOCS-only write leaves a single document with Sign: DOCS', async () => {
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-docs-only',
      collapse_id: 'c-docs-only',
      Sign: RadarDetectionSource.DOCS,
    } as any])

    const detection = await RadarDetectionService.getDetectionById('det-docs-only')
    expect(detection?.Sign).toBe(RadarDetectionSource.DOCS)
  })

  it('a RADAR write followed by a DOCS write for the same id converges to SYNCED', async () => {
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-synced',
      collapse_id: 'c-synced-radar',
      Sign: RadarDetectionSource.RADAR,
    } as any])
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-synced',
      collapse_id: 'c-synced-docs',
      Sign: RadarDetectionSource.DOCS,
    } as any])

    const detection = await RadarDetectionService.getDetectionById('det-synced')
    expect(detection?.Sign).toBe(RadarDetectionSource.SYNCED)

    const documents = await RadarDetectionModel.find({ id: 'det-synced' })
    expect(documents).toHaveLength(1)
  })

  it('a DOCS write followed by a RADAR write for the same id also converges to SYNCED', async () => {
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-synced-reverse-order',
      collapse_id: 'c-synced-reverse-docs',
      Sign: RadarDetectionSource.DOCS,
    } as any])
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-synced-reverse-order',
      collapse_id: 'c-synced-reverse-radar',
      Sign: RadarDetectionSource.RADAR,
    } as any])

    const detection = await RadarDetectionService.getDetectionById('det-synced-reverse-order')
    expect(detection?.Sign).toBe(RadarDetectionSource.SYNCED)
  })

  it('merges platformIds/environmentNames across RADAR writes instead of overwriting', async () => {
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-merge-arrays',
      collapse_id: 'c-merge-1',
      Sign: RadarDetectionSource.RADAR,
      platformIds: ['plat-1'],
    } as any])
    await RadarDetectionService.createDetections([{
      ...baseDetection,
      id: 'det-merge-arrays',
      collapse_id: 'c-merge-2',
      Sign: RadarDetectionSource.RADAR,
      platformIds: ['plat-2'],
    } as any])

    const detection = await RadarDetectionService.getDetectionById('det-merge-arrays')
    expect((detection as any)?.platformIds.sort()).toEqual(['plat-1', 'plat-2'])
  })
})

describe('listRadarDetectionsWithSign / getRadarDetectionsWithSignCount: Sign filtering', () => {
  it('Sign: RADAR returns the RADAR-only detections (including the array-merge one)', async () => {
    const rows = await RadarDetectionService.listRadarDetectionsWithSign(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.RADAR } as any,
      { skip: 0, limit: 50 },
      undefined,
      false,
    ) as any[]

    expect(rows.find((row) => row.id === 'det-radar-only')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-merge-arrays')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-docs-only')).toBeUndefined()
    expect(rows.find((row) => row.id === 'det-synced')).toBeUndefined()

    const count = await RadarDetectionService.getRadarDetectionsWithSignCount(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.RADAR } as any,
    )
    expect(count).toBe(2)
  })

  it('Sign: DOCS returns only the DOCS-only detection', async () => {
    const rows = await RadarDetectionService.listRadarDetectionsWithSign(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.DOCS } as any,
      { skip: 0, limit: 50 },
      undefined,
      false,
    ) as any[]

    expect(rows.find((row) => row.id === 'det-docs-only')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-radar-only')).toBeUndefined()
    expect(rows.find((row) => row.id === 'det-synced')).toBeUndefined()

    const count = await RadarDetectionService.getRadarDetectionsWithSignCount(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.DOCS } as any,
    )
    expect(count).toBe(1)
  })

  it('Sign: SYNCED returns only detections observed from both sources', async () => {
    const rows = await RadarDetectionService.listRadarDetectionsWithSign(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.SYNCED } as any,
      { skip: 0, limit: 50 },
      undefined,
      false,
    ) as any[]

    expect(rows.map((row) => row.id).sort()).toEqual(['det-synced', 'det-synced-reverse-order'])

    const count = await RadarDetectionService.getRadarDetectionsWithSignCount(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID, Sign: RadarDetectionSource.SYNCED } as any,
    )
    expect(count).toBe(2)
  })

  it('Sign: [RADAR, DOCS] includes both single-source detections, excludes SYNCED', async () => {
    const rows = await RadarDetectionService.listRadarDetectionsWithSign(
      {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        Sign: [RadarDetectionSource.RADAR, RadarDetectionSource.DOCS],
      } as any,
      { skip: 0, limit: 50 },
      undefined,
      false,
    ) as any[]

    expect(rows.find((row) => row.id === 'det-radar-only')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-docs-only')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-merge-arrays')).toBeDefined()
    expect(rows.find((row) => row.id === 'det-synced')).toBeUndefined()

    const count = await RadarDetectionService.getRadarDetectionsWithSignCount(
      {
        workspaceId: WORKSPACE_ID,
        projectId: PROJECT_ID,
        Sign: [RadarDetectionSource.RADAR, RadarDetectionSource.DOCS],
      } as any,
    )
    expect(count).toBe(3)
  })

  it('counts everything when no Sign filter is given', async () => {
    const count = await RadarDetectionService.getRadarDetectionsWithSignCount(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID } as any,
    )
    expect(count).toBe(5)
  })
})

describe('getNotAppliedDetections: RADAR-observed detections not yet documented', () => {
  it('excludes a SYNCED detection', async () => {
    const rows = await RadarDetectionService.getNotAppliedDetections(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID } as any,
      undefined,
      false,
    ) as any[]

    expect(rows.find((row) => row.id === 'det-synced')).toBeUndefined()
  })

  it('keeps a RADAR-only detection with no matching documentation', async () => {
    const rows = await RadarDetectionService.getNotAppliedDetections(
      { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID } as any,
      undefined,
      false,
    ) as any[]

    expect(rows.find((row) => row.id === 'det-radar-only')).toBeDefined()
  })
})

describe('deleteDetections: flips the relevant flag(s), purges once fully orphaned', () => {
  it('Sign: RADAR on a SYNCED detection clears isRadarObserved but keeps the document (now DOCS)', async () => {
    await RadarDetectionService.deleteDetections({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      id: 'det-synced',
      Sign: RadarDetectionSource.RADAR,
    } as any)

    const detection = await RadarDetectionService.getDetectionById('det-synced')
    expect(detection?.Sign).toBe(RadarDetectionSource.DOCS)
  })

  it('Sign: DOCS on the now-DOCS-only detection fully removes it (both flags false)', async () => {
    await RadarDetectionService.deleteDetections({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      id: 'det-synced',
      Sign: RadarDetectionSource.DOCS,
    } as any)

    const detection = await RadarDetectionService.getDetectionById('det-synced')
    expect(detection).toBeUndefined()
  })

  it('Sign: [DOCS, RADAR] on a SYNCED detection removes it in one call', async () => {
    await RadarDetectionService.deleteDetections({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      id: 'det-synced-reverse-order',
      Sign: [RadarDetectionSource.DOCS, RadarDetectionSource.RADAR],
    } as any)

    const detection = await RadarDetectionService.getDetectionById('det-synced-reverse-order')
    expect(detection).toBeUndefined()
  })

  it('deleting one source leaves an unrelated detection from the other source untouched', async () => {
    await RadarDetectionService.deleteDetections({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      id: 'det-radar-only',
      Sign: RadarDetectionSource.RADAR,
    } as any)

    const deleted = await RadarDetectionService.getDetectionById('det-radar-only')
    expect(deleted).toBeUndefined()

    const stillThere = await RadarDetectionService.getDetectionById('det-docs-only')
    expect(stillThere).not.toBeUndefined()
  })
})
