import { RadarDetectionParamSource } from '@multiplayer/types'

export interface IHttpParam {
  paramPath: string
  paramType: string
  paramFormat: string | undefined
  paramSource: RadarDetectionParamSource
}
