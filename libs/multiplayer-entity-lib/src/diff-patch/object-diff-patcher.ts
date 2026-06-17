import { DiffPatcher } from './diff-patcher'
import * as jsondiffpatch from 'jsondiffpatch'

export class ObjectDiffPatcher implements DiffPatcher<object> {
  private patcher: jsondiffpatch.DiffPatcher

  constructor(textDiffOptions: { minLength: number } = { minLength: 1 }) {
    this.patcher = jsondiffpatch.create({ textDiff: textDiffOptions })
  }

  applyPatch(data: object, patch: jsondiffpatch.Delta): [boolean, object] {
    this.patcher.patch(data, patch)
    return [true, data] // is always true, because js allows to merge objects with any structure
  }

  hasConflicts(patch1: jsondiffpatch.Delta | undefined, patch2: jsondiffpatch.Delta | undefined): boolean {
    if (!patch2 || !patch1)
      return false

    if (typeof patch1 !== 'object' || typeof patch2 !== 'object') {
      return true
    }

    for (const key in patch1) {
      if (key === '_t' || !patch2[key] || typeof patch2[key] !== 'object') {
        continue
      }

      if (Array.isArray(patch1[key])) {
        const diff = this.patcher.diff(patch1[key], patch2[key])
        if (diff) {
          return true
        }
        continue
      }
      const hasConflicts = this.hasConflicts(patch1[key], patch2[key])
      if (hasConflicts) {
        return true
      }
    }
    return false
  }

  getDiff(lhs, rhs): jsondiffpatch.Delta | undefined {
    return this.patcher.diff(lhs, rhs)
  }

  getConflictPaths(patch1: jsondiffpatch.Delta, patch2: jsondiffpatch.Delta, path: string[] = []) {
    const conflicts: string[][] = []

    Object.keys(patch1).forEach((key) => {
      if (key === '_t' || !patch2[key] || typeof patch2[key] !== 'object') return

      if (Array.isArray(patch1[key])) {
        const diff = this.patcher.diff(patch1[key], patch2[key])
        if (diff) {
          conflicts.push([...path, key])
        }
        return
      } else if (Array.isArray(patch2[key])) {
        conflicts.push([...path, key])
        return
      }

      const changedPaths = this.getConflictPaths(patch1[key], patch2[key], [...path, key])
      conflicts.push(...changedPaths)
    })

    return conflicts
  }
}
