import { ITag } from './tag'

export interface IFlowMetadata {
  _id: string
  id: string
  workspace: string
  project: string
  // environmentName?: string
  // entityPlatformId?: string
  name: string
  tags: ITag[]
  starredSpanIds: string[]

  platformIds: string[]
  environmentNames: string[]
  componentNames: string[]

  rootSpanId: string

  createdAt: string | Date
  updatedAt: string | Date
}
