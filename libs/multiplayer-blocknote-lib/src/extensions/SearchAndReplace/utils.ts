import { Range, type Dispatch } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { type EditorState, type Transaction } from '@tiptap/pm/state'
import { Node as PMNode } from '@tiptap/pm/model'
import { ProcessedSearches, TextNodesWithPosition } from './types'

export const getRegex = (s: string, disableRegex: boolean, caseSensitive: boolean): RegExp => {
  return RegExp(disableRegex ? s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : s, caseSensitive ? 'gu' : 'gui')
}

export function processSearches(
  doc: PMNode,
  searchTerm: RegExp,
  searchResultClass: string,
  resultIndex: number,
): ProcessedSearches {
  const decorations: Decoration[] = []
  const results: Range[] = []

  let textNodesWithPosition: TextNodesWithPosition[] = []
  let index = 0

  if (!searchTerm) {
    return {
      decorationsToReturn: DecorationSet.empty,
      results: [],
    }
  }

  doc?.descendants((node, pos) => {
    if (node.isText) {
      if (textNodesWithPosition[index]) {
        textNodesWithPosition[index] = {
          text: textNodesWithPosition[index].text + node.text,
          pos: textNodesWithPosition[index].pos,
        }
      } else {
        textNodesWithPosition[index] = {
          text: `${node.text}`,
          pos,
        }
      }
    } else {
      index += 1
    }
  })

  textNodesWithPosition = textNodesWithPosition.filter(Boolean)

  for (const element of textNodesWithPosition) {
    const { text, pos } = element
    const matches = Array.from(text.matchAll(searchTerm)).filter(([matchText]) => matchText.trim())

    for (const m of matches) {
      if (m[0] === '') break

      if (m.index !== undefined) {
        results.push({
          from: pos + m.index,
          to: pos + m.index + m[0].length,
        })
      }
    }
  }

  for (let i = 0; i < results.length; i += 1) {
    const r = results[i]
    const className = i === resultIndex ? `${searchResultClass} ${searchResultClass}-current` : searchResultClass
    const decoration: Decoration = Decoration.inline(r.from, r.to, {
      class: className,
    })

    decorations.push(decoration)
  }

  return {
    decorationsToReturn: DecorationSet.create(doc, decorations),
    results,
  }
}

export const replace = (
  replaceTerm: string,
  results: Range[],
  { state, dispatch }: { state: EditorState; dispatch: Dispatch },
) => {
  const firstResult = results[0]

  if (!firstResult) return

  const { from, to } = results[0]

  if (dispatch) dispatch(state.tr.insertText(replaceTerm, from, to))
}

export const rebaseNextResult = (
  replaceTerm: string,
  index: number,
  lastOffset: number,
  results: Range[],
): [number, Range[]] | null => {
  const nextIndex = index + 1

  if (!results[nextIndex]) return null

  const { from: currentFrom, to: currentTo } = results[index]

  const offset = currentTo - currentFrom - replaceTerm.length + lastOffset

  const { from, to } = results[nextIndex]

  results[nextIndex] = {
    to: to - offset,
    from: from - offset,
  }

  return [offset, results]
}

export const replaceAll = (
  replaceTerm: string,
  results: Range[],
  { tr, dispatch }: { tr: Transaction; dispatch: Dispatch },
) => {
  let offset = 0

  let resultsCopy = results.slice()

  if (!resultsCopy.length) return

  for (let i = 0; i < resultsCopy.length; i += 1) {
    const { from, to } = resultsCopy[i]

    tr.insertText(replaceTerm, from, to)

    const rebaseNextResultResponse = rebaseNextResult(replaceTerm, i, offset, resultsCopy)

    if (!rebaseNextResultResponse) continue

    offset = rebaseNextResultResponse[0]
    resultsCopy = rebaseNextResultResponse[1]
  }

  dispatch && dispatch(tr)
}
