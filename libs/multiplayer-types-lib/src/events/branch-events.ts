import { CallbackData } from './callback-data'

export type Resolution = {
  entityCommitId?: string,
  patch?: object
}

export enum BranchEvents {
  UPDATE = 'v0/branch/update',
  MERGE = 'v0/branch/merge',
  DELETE = 'v0/branch/delete'
}

export type BranchEventsClientMap = {
  [BranchEvents.UPDATE]: (
    params: {
      branchToUpdate: string,
      baseBranch: string,
      resolutions?: Record<string, Resolution>,
    },
    callback?: (data: CallbackData<void>) => void) => void
  [BranchEvents.MERGE]: (
    params: {
      projectBranchFrom: string,
      projectBranchTo: string,
      excludedEntities?: string[]
    },
    callback?: (data: CallbackData<void>) => void) => void
}
export type BranchEventsServerMap = {
  [BranchEvents.DELETE] : (deletedBranchId: string) => void
}
