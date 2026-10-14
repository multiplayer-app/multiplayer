import express from 'express'
import request from 'supertest'
import mongo from '@multiplayer/mongo'
import { RadarDetectionModel } from '@multiplayer/models'
import { RadarDetectionSource, RadarDetectionType } from '@multiplayer/types'
import * as RadarDetectionService from '../src/services/radar-detection.service'
import { ValidationMiddleware } from '../src/middleware'
import list from '../src/routes/radar-detections/list'

// A minimal app mounting the real list route + its real Joi validation middleware
// (which coerces the `Sign` query string into the numeric RadarDetectionSource
// values the service expects - skipping it would silently hide that behavior).
// `authorize()` is left out entirely rather than mocked: it needs full session/role
// infra unrelated to what's under test here, and list.ts itself doesn't depend on it
// (only routes/radar-detections/index.ts wires it in).
const { RadarDetectionValidationMiddleware } = ValidationMiddleware

const app = express()
const router = express.Router({ mergeParams: true })
router.get('/', RadarDetectionValidationMiddleware.validateListRadarDetections, list)
app.use('/workspaces/:workspaceId/projects/:projectId/radar-detections', router)

// Joi's `.hex().length(24)` requires Mongo-ObjectId-shaped path params.
const WORKSPACE_ID = '507f1f77bcf86cd799430001'
const PROJECT_ID = '507f1f77bcf86cd799430002'
const BASE_PATH = `/workspaces/${WORKSPACE_ID}/projects/${PROJECT_ID}/radar-detections`

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

  await RadarDetectionService.createDetections([
    {
      ...baseDetection,
      id: 'api-det-radar-only',
      collapse_id: 'api-c-radar-only',
      Sign: RadarDetectionSource.RADAR,
    } as any,
    {
      ...baseDetection,
      id: 'api-det-docs-only',
      collapse_id: 'api-c-docs-only',
      Sign: RadarDetectionSource.DOCS,
    } as any,
    {
      ...baseDetection,
      id: 'api-det-synced',
      collapse_id: 'api-c-synced-radar',
      Sign: RadarDetectionSource.RADAR,
    } as any,
    {
      ...baseDetection,
      id: 'api-det-synced',
      collapse_id: 'api-c-synced-docs',
      Sign: RadarDetectionSource.DOCS,
    } as any,
  ])
})

afterAll(async () => {
  await RadarDetectionModel.deleteMany({ workspaceId: WORKSPACE_ID })
  await mongo.disconnect()
})

describe('GET /workspaces/:workspaceId/projects/:projectId/radar-detections', () => {
  it('returns everything (RADAR, DOCS-only, SYNCED) with no Sign filter', async () => {
    const response = await request(app)
      .get(BASE_PATH)
      .expect(200)

    const ids = response.body.data.map((row: any) => row.id)
    expect(ids).toEqual(expect.arrayContaining([
      'api-det-radar-only',
      'api-det-docs-only',
      'api-det-synced',
    ]))
    expect(response.body.cursor.total).toBe(3)
  })

  it('Sign=-1 (RADAR) returns only the not-yet-documented detection', async () => {
    const response = await request(app)
      .get(BASE_PATH)
      .query({ Sign: RadarDetectionSource.RADAR })
      .expect(200)

    const ids = response.body.data.map((row: any) => row.id)
    expect(ids).toEqual(['api-det-radar-only'])
    expect(response.body.cursor.total).toBe(1)
  })

  it('Sign=1 (DOCS) returns only the documented-but-never-observed detection', async () => {
    const response = await request(app)
      .get(BASE_PATH)
      .query({ Sign: RadarDetectionSource.DOCS })
      .expect(200)

    const ids = response.body.data.map((row: any) => row.id)
    expect(ids).toEqual(['api-det-docs-only'])
    expect(response.body.cursor.total).toBe(1)
  })

  it('Sign=0 (SYNCED) returns only the detection seen in both stores', async () => {
    const response = await request(app)
      .get(BASE_PATH)
      .query({ Sign: RadarDetectionSource.SYNCED })
      .expect(200)

    const ids = response.body.data.map((row: any) => row.id)
    expect(ids).toEqual(['api-det-synced'])
    expect(response.body.cursor.total).toBe(1)
  })
})
