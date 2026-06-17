export enum WarningEvents {
  MERGE_FINISHED = 'v0/warning/merge-finished',
  MERGE_FAILED = 'v0/warning/merge-failed'
}

export type WarningEventsServerMap = {
  [WarningEvents.MERGE_FINISHED]: (data: {
    projectBranchFrom: string,
    projectBranchTo: string
  }) => void
  [WarningEvents.MERGE_FAILED]: () => void
}
