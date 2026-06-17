import { DecorationSet } from '@tiptap/pm/view'
import { Range } from '@tiptap/core'

export interface TextNodesWithPosition {
  text: string
  pos: number
}

export interface ProcessedSearches {
  decorationsToReturn: DecorationSet
  results: Range[]
}

export interface SearchAndReplaceOptions {
  searchResultClass: string
  disableRegex: boolean
}
