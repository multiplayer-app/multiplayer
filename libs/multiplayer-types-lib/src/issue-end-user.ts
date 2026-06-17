import { IIssue } from './issue'
import { IEndUser } from './end-user'

export interface IIssueEndUser {
  _id?: string

  workspace: string
  project: string

  issue: IIssue
  endUser: IEndUser

  lastSeen?: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
}
