import { IComment } from './comment'
import { IEntity } from './entity'
import { ObjectTypeEnum } from './enums'

export enum ThreadStatus {
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
  ACTIVE = 'ACTIVE'
}

export interface IThread {
  _id: string
  workspace: string
  project: string
  branch: string
  objectId?: string
  objectType: ObjectTypeEnum
  initiator: string
  usersInDiscussion: string[]
  status: ThreadStatus
  commentablePath?: string[]
  position?: number[]
  createdAt?: string
  updatedAt?: string
  lastActivityAt: string
  firstComment: string
  totalComments: number
}

export type IThreadResponse = IThread & {
  comments: IComment[]
  entity?: IEntity
}
