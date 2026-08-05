import mongo from '@multiplayer/mongo'
import { FlowModel } from '@multiplayer/models'
import * as FlowService from '../src/services/flow.service'

const WORKSPACE_ID = 'w-flows-1'
const PROJECT_ID = 'p-flows-1'

const baseFlow = {
  workspaceId: WORKSPACE_ID,
  projectId: PROJECT_ID,
  Timestamp: new Date('2024-01-01T00:00:00Z'),
}

beforeAll(async () => {
  await mongo.connect()
})

afterAll(async () => {
  await FlowModel.deleteMany({ workspaceId: WORKSPACE_ID })
  await mongo.disconnect()
})

describe('createFlow: plain last-write-wins upsert', () => {
  it('overwrites (not merges) the sequence on a second write for the same id', async () => {
    await FlowService.createFlow({
      ...baseFlow,
      id: 'flow-1',
      sequence: [{ spanId: 's1', componentName: 'svc-a', name: 'GET /foo', kind: 2 }],
    })
    await FlowService.createFlow({
      ...baseFlow,
      id: 'flow-1',
      sequence: [{ spanId: 's2', componentName: 'svc-b', name: 'POST /bar', kind: 3 }],
    })

    const flow = await FlowService.getFlowById('flow-1')

    expect(flow?.sequence).toHaveLength(1)
    expect(flow?.sequence[0].spanId).toBe('s2')
  })

  it('getFlowById returns undefined for an id that was never created', async () => {
    const flow = await FlowService.getFlowById('flow-does-not-exist')

    expect(flow).toBeUndefined()
  })
})

describe('listUniqueComponentsFromFlows: distinct componentName across all sequences', () => {
  beforeAll(async () => {
    await FlowService.createFlow({
      ...baseFlow,
      id: 'flow-unique-1',
      sequence: [
        { spanId: 's1', componentName: 'svc-a', name: 'GET /foo', kind: 2 },
        { spanId: 's2', componentName: 'svc-b', name: 'POST /bar', kind: 3 },
      ],
    })
    await FlowService.createFlow({
      ...baseFlow,
      id: 'flow-unique-2',
      sequence: [{ spanId: 's3', componentName: 'svc-b', name: 'GET /baz', kind: 2 }],
    })
  })

  it('dedupes componentName across multiple flows and sequence entries', async () => {
    const components = await FlowService.listUniqueComponentsFromFlows({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
    })

    expect(components.sort()).toEqual(['svc-a', 'svc-b'])
  })
})

describe('deleteFlowById / deleteFlows', () => {
  it('deleteFlowById removes a single flow by id', async () => {
    await FlowService.createFlow({ ...baseFlow, id: 'flow-delete-1', sequence: [] })

    await FlowService.deleteFlowById('flow-delete-1')

    const flow = await FlowService.getFlowById('flow-delete-1')
    expect(flow).toBeUndefined()
  })

  it('deleteFlows removes only the ids given, leaving others in the same workspace/project untouched', async () => {
    await FlowService.createFlow({ ...baseFlow, id: 'flow-bulk-1', sequence: [] })
    await FlowService.createFlow({ ...baseFlow, id: 'flow-bulk-2', sequence: [] })

    await FlowService.deleteFlows({
      workspaceId: WORKSPACE_ID,
      projectId: PROJECT_ID,
      id: ['flow-bulk-1'],
    })

    expect(await FlowService.getFlowById('flow-bulk-1')).toBeUndefined()
    expect(await FlowService.getFlowById('flow-bulk-2')).not.toBeUndefined()
  })
})
