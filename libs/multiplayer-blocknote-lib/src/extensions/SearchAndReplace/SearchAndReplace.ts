import { Extension, Range } from '@tiptap/core'
import { DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { SearchAndReplaceOptions } from './types'
import { replaceAll, processSearches, getRegex, replace } from './utils'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    search: {
      /**
       * @description Set search term in extension.
       */
      setSearchTerm: (searchTerm: string) => ReturnType
      /**
       * @description Set replace term in extension.
       */
      setReplaceTerm: (replaceTerm: string) => ReturnType
      /**
       * @description Set case sensitivity in extension.
       */
      setCaseSensitive: (caseSensitive: boolean) => ReturnType
      /**
       * @description Reset current search result to first instance.
       */
      resetIndex: () => ReturnType
      /**
       * @description Find next instance of search result.
       */
      nextSearchResult: () => ReturnType
      /**
       * @description Find previous instance of search result.
       */
      previousSearchResult: () => ReturnType
      /**
       * @description Replace first instance of search result with given replace term.
       */
      replace: () => ReturnType
      /**
       * @description Replace all instances of search result with given replace term.
       */
      replaceAll: () => ReturnType
    }
  }
}

export const searchAndReplacePluginKey = new PluginKey('searchAndReplacePlugin')

export interface SearchAndReplaceStorage {
  searchTerm: string
  replaceTerm: string
  results: Range[]
  lastSearchTerm: string
  caseSensitive: boolean
  lastCaseSensitive: boolean
  resultIndex: number
  lastResultIndex: number
}

export const SearchAndReplace = Extension.create<SearchAndReplaceOptions, SearchAndReplaceStorage>({
  name: 'searchAndReplace',

  addOptions() {
    return {
      searchResultClass: 'search-result',
      disableRegex: true,
    }
  },

  addStorage() {
    return {
      searchTerm: '',
      replaceTerm: '',
      results: [],
      lastSearchTerm: '',
      caseSensitive: false,
      lastCaseSensitive: false,
      resultIndex: 0,
      lastResultIndex: 0,
    }
  },

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.searchTerm = searchTerm

          return false
        },
      setReplaceTerm:
        (replaceTerm: string) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.replaceTerm = replaceTerm

          return false
        },
      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ editor }) => {
          editor.storage.searchAndReplace.caseSensitive = caseSensitive

          return false
        },
      resetIndex:
        () =>
        ({ editor }) => {
          editor.storage.searchAndReplace.resultIndex = 0

          return false
        },
      nextSearchResult:
        () =>
        ({ editor }) => {
          const { results, resultIndex } = editor.storage.searchAndReplace

          const nextIndex = resultIndex + 1

          if (results[nextIndex]) {
            editor.storage.searchAndReplace.resultIndex = nextIndex
          } else {
            editor.storage.searchAndReplace.resultIndex = 0
          }

          return false
        },
      previousSearchResult:
        () =>
        ({ editor }) => {
          const { results, resultIndex } = editor.storage.searchAndReplace

          const prevIndex = resultIndex - 1

          if (results[prevIndex]) {
            editor.storage.searchAndReplace.resultIndex = prevIndex
          } else {
            editor.storage.searchAndReplace.resultIndex = results.length - 1
          }

          return false
        },
      replace:
        () =>
        ({ editor, state, dispatch }) => {
          const { replaceTerm, results } = editor.storage.searchAndReplace

          replace(replaceTerm, results, { state, dispatch })

          return false
        },
      replaceAll:
        () =>
        ({ editor, tr, dispatch }) => {
          const { replaceTerm, results } = editor.storage.searchAndReplace

          replaceAll(replaceTerm, results, { tr, dispatch })

          return false
        },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const { searchResultClass, disableRegex } = this.options

    const setLastSearchTerm = (t: string) => (editor.storage.searchAndReplace.lastSearchTerm = t)
    const setLastCaseSensitive = (t: boolean) => (editor.storage.searchAndReplace.lastCaseSensitive = t)
    const setLastResultIndex = (t: number) => (editor.storage.searchAndReplace.lastResultIndex = t)

    return [
      new Plugin({
        key: searchAndReplacePluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply({ doc, docChanged }, oldState) {
            const { searchTerm, lastSearchTerm, caseSensitive, lastCaseSensitive, resultIndex, lastResultIndex } =
              editor.storage.searchAndReplace

            if (
              !docChanged &&
              lastSearchTerm === searchTerm &&
              lastCaseSensitive === caseSensitive &&
              lastResultIndex === resultIndex
            )
              return oldState

            setLastSearchTerm(searchTerm)
            setLastCaseSensitive(caseSensitive)
            setLastResultIndex(resultIndex)

            if (!searchTerm) {
              editor.storage.searchAndReplace.results = []
              return DecorationSet.empty
            }

            const { decorationsToReturn, results } = processSearches(
              doc,
              getRegex(searchTerm, disableRegex, caseSensitive),
              searchResultClass,
              resultIndex,
            )

            editor.storage.searchAndReplace.results = results

            return decorationsToReturn
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

export default SearchAndReplace
