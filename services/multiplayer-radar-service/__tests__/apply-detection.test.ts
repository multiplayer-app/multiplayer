import { RadarDetectionSource, RadarDetectionType, type IRadarDetection } from '@multiplayer/types'

jest.mock('../src/services', () => ({
  EntityService: {
    getEntitiesByKeys: jest.fn().mockResolvedValue([]),
  },
  VersionService: jest.fn(),
  InternalVersionService: jest.fn().mockImplementation(() => ({
    createEntity: jest.fn().mockResolvedValue(undefined),
  })),
}))

import { EntityService } from '../src/services'
import { applyEnvironmentDetection } from '../src/util/apply-detection'

const baseDetection = (overrides: Partial<IRadarDetection> = {}): IRadarDetection => ({
  id: 'w1:p1:ENVIRONMENT:production',
  Sign: RadarDetectionSource.RADAR,
  workspaceId: 'w1',
  projectId: 'p1',
  type: RadarDetectionType.ENVIRONMENT,
  Timestamp: new Date(),
  ...overrides,
} as IRadarDetection)

describe('applyEnvironmentDetection: reads the per-detection environmentName field', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('proceeds when detection.environmentName (singular) is set - the field every real ENVIRONMENT detection actually has', async () => {
    const detection = baseDetection({ environmentName: 'production' })

    await applyEnvironmentDetection(detection, 'w1', 'p1', 'branch-1')

    // Reaching the lookup at all proves validation didn't bail out early - regression
    // guard for detection.environmentNames (plural, an aggregate-only field computed
    // via RadarDetectionModel.distinct() and never set on an individual detection)
    // being checked instead of the singular field every real detection has.
    expect(EntityService.getEntitiesByKeys).toHaveBeenCalledWith(
      'w1', 'p1', ['production'], 'branch-1', 'environment',
    )
  })

  it('bails out without querying anything when environmentName is missing', async () => {
    const detection = baseDetection({ environmentName: undefined })

    await applyEnvironmentDetection(detection, 'w1', 'p1', 'branch-1')

    expect(EntityService.getEntitiesByKeys).not.toHaveBeenCalled()
  })

  it('bails out when environmentName is not already slugified', async () => {
    const detection = baseDetection({ environmentName: 'Not Slug!' })

    await applyEnvironmentDetection(detection, 'w1', 'p1', 'branch-1')

    expect(EntityService.getEntitiesByKeys).not.toHaveBeenCalled()
  })
})
