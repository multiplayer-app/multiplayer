import { RadarDetectionType } from '@multiplayer/types'
export interface UniqueDetection {
  type: RadarDetectionType.ENVIRONMENT | RadarDetectionType.SERVICE,
  componentName: string,
  environmentName: string
  environmentNames: string[]
  releases: string[]
  Timestamp: string
}
