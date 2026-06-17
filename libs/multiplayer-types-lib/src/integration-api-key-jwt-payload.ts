import {
  IntegrationTypeEnum,
  ObjectTypeEnum,
} from './enums'

export interface IIntegrationApiKeyJwtPaylaod {
  integration?: string
  workspace: string
  project: string
  type: IntegrationTypeEnum

  temporary?: boolean
  objectType?: ObjectTypeEnum
  objectId?: string
}
