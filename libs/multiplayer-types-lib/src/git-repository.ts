import { IntegrationTypeEnum } from './enums'

export interface IGitRepository {
  _id: string
  workspace: string
  project: string
  gitRepository: {
    _id: string
    id: string
    type: IntegrationTypeEnum
    private: boolean
    name: string
    owner: string
    defaultBranch: string
    url: string
  }
  archived: boolean
  createdAt: string
  updatedAt: string
  branches?: any[]
}
