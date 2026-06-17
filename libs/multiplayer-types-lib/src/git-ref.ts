import {
  IntegrationTypeEnum,
  GitContentType,
} from './enums'

export interface IGitRef {
  repositoryType: IntegrationTypeEnum
  repositoryId: string // id from git provider
  repositoryName: string
  repositoryOwner: string
  branch?: string
  path?: string
  contentType?: GitContentType
}
