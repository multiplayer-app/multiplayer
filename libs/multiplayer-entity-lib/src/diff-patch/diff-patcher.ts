export interface DiffPatcher<T> {
  getDiff(lhs: T, rhs: T): any
  applyPatch(data: T, patch: any): [boolean, T]
  hasConflicts(patch1, patch2, initialData): boolean
}
