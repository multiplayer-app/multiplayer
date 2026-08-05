import { CommitContentActionEnum } from './commit-content-action.enum'

export type CommitContent = {
  action: CommitContentActionEnum
  filePath: string
  content?: string
  previousPath?: string
}
