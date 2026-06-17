import { ObjectTypeEnum } from './enums'

export interface IComment {
  _id: string
  workspace: string
  project: string
  objectId: string
  objectType: ObjectTypeEnum
  thread: string
  branch: string
  content: string
  workspaceUser: string
  createdAt: string
  updatedAt: string
}
