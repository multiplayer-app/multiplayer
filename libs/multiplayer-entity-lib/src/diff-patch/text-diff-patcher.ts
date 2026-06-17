import { DiffPatcher } from './diff-patcher'
import DiffMatchPatch from 'diff-match-patch'

export class TextDiffPatcher implements DiffPatcher<string> {
  private patcher: DiffMatchPatch
  constructor() {
    this.patcher = new DiffMatchPatch()
  }

  applyPatch(data: string, patch: any): [boolean, string] {
    const [text, results] = this.patcher.patch_apply(patch, data)
    const hasConflicts = results.find((result) => !result)
    return [!hasConflicts, text]
  }

  hasConflicts(patch1: any, patch2: any, initialData: string): boolean {
    const [text1] = this.patcher.patch_apply(patch1, initialData)
    const [, results] = this.patcher.patch_apply(patch2, text1)
    const hasConflicts = results.find((result) => !result)
    return !!hasConflicts
  }

  getDiff(lhs:string, rhs: string): any {
    return this.patcher.patch_make(lhs, rhs)
  }
}
