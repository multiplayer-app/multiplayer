import { DiffPatcher } from './diff-patcher'
import DiffMatchPatch from 'diff-match-patch'
import { TextDiffPatcher } from './text-diff-patcher'
import { SourceData } from '@multiplayer/types'

export class SourceEntityDiffPatcher implements DiffPatcher<SourceData> {
  private patcher: TextDiffPatcher
  constructor() {
    this.patcher = new TextDiffPatcher()
  }

  applyPatch(data: SourceData, patch: any): [boolean, SourceData] {
    const [hasConflicts, updatedText] = this.patcher.applyPatch(data.contents, patch)
    return [hasConflicts, {
      ...data,
      contents: updatedText,
    }]
  }

  hasConflicts(patch1: any, patch2: any, initialData: SourceData): boolean {
    const [applied, updatedText] = this.patcher.applyPatch(initialData.contents, patch1)
    if (!applied) return true
    const [applied2] = this.patcher.applyPatch(updatedText, patch2)
    return !applied2
  }

  getDiff(lhs:SourceData, rhs: SourceData): any {
    return this.patcher.getDiff(lhs.contents, rhs.contents)
  }
}
