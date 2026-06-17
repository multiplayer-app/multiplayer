import { TextDiffPatcher } from './text-diff-patcher'
import { ObjectDiffPatcher } from './object-diff-patcher'

export type { DiffPatcher } from './diff-patcher'
export * from './helpers'
export const textDiffPatcher = new TextDiffPatcher()
export const objectDiffPatcher = new ObjectDiffPatcher()
