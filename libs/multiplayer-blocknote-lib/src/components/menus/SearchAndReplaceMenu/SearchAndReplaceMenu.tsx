import React, { memo, useCallback, useEffect, useState } from 'react'
import { MenuProps } from '../types'
import { Toolbar } from '../../ui/Toolbar'
import { Icon } from '../../../components/ui/Icon'
import { Range } from '@tiptap/core'

const MemoButton = memo(Toolbar.Button)

const SearchAndReplaceMenu = React.memo(({ editor }: MenuProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [replaceTerm, setReplaceTerm] = useState<string>('')
  const [result, setResult] = useState('')

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const updateResult = useCallback(() => {
    setResult(
      editor?.storage?.searchAndReplace?.results.length
        ? `${editor?.storage?.searchAndReplace?.resultIndex + 1} / ${editor?.storage?.searchAndReplace?.results.length}`
        : '',
    )
  }, [editor])

  const goToSelection = () => {
    if (!editor) return

    const { results, resultIndex } = editor.storage.searchAndReplace
    const position: Range = results[resultIndex]

    if (!position) return

    editor.commands.setTextSelection(position)

    const { node } = editor.view.domAtPos(editor.state.selection.anchor)
    node instanceof HTMLElement && node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    updateResult()
  }

  const updateSearchReplace = useCallback(
    (clearIndex: boolean = false) => {
      if (!editor) return

      if (clearIndex) editor.commands.resetIndex()

      editor.commands.setSearchTerm(searchTerm)
      editor.commands.setReplaceTerm(replaceTerm)
      editor.commands.setCaseSensitive(caseSensitive)
      updateResult()
    },
    [editor, searchTerm, replaceTerm, caseSensitive],
  )

  const clear = useCallback(() => {
    setSearchTerm('')
    setReplaceTerm('')
    editor.commands.resetIndex()
  }, [])

  const replace = () => {
    editor?.commands.replace()
    goToSelection()
  }

  const next = () => {
    editor?.commands.nextSearchResult()
    goToSelection()
  }

  const previous = () => {
    editor?.commands.previousSearchResult()
    goToSelection()
  }

  const replaceAll = () => editor?.commands.replaceAll()

  const close = useCallback(() => {
    setIsOpen(false)
    clear()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      updateSearchReplace(true)
    } else {
      clear()
    }
  }, [searchTerm, updateSearchReplace, clear])

  useEffect(() => {
    if (replaceTerm.trim()) {
      updateSearchReplace(true)
    }
  }, [replaceTerm, updateSearchReplace])

  useEffect(() => {
    updateSearchReplace(true)
  }, [caseSensitive, updateSearchReplace, clear])

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        close()
      }
    }

    if (isOpen) {
      editor.on('update', updateResult)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      editor.off('update', updateResult)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, editor, close])

  if (!isOpen) return <div />

  return (
    <div className="absolute top-0 right-8 bg-white dark:bg-neutral-900 shadow-md p-2 rounded-b-lg flex gap-2 border border-gray-200 dark:border-neutral-800">
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          type="text"
          value={searchTerm}
          placeholder="Search..."
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && next()}
          className="bg-gray-50 rounded-lg p-2 w-full text-sm"
        />
        {editor.isEditable && (
          <input
            type="text"
            value={replaceTerm}
            placeholder="Replace..."
            className="bg-gray-50 rounded-lg p-2 w-full text-sm"
            onKeyDown={e => e.key === 'Enter' && replace()}
            onChange={e => setReplaceTerm(e.target.value)}
          />
        )}
        <div className="flex gap-1 items-center">
          <MemoButton tooltip="Case sensitive" onClick={() => setCaseSensitive(prev => !prev)} active={caseSensitive}>
            <Icon name="CaseSensitive" />
          </MemoButton>
          {editor.isEditable && (
            <>
              <MemoButton tooltip="Replace" onClick={replace}>
                <Icon name="Replace" />
              </MemoButton>
              <MemoButton tooltip="Replace all" onClick={replaceAll}>
                <Icon name="ReplaceAll" />
              </MemoButton>
            </>
          )}
          <MemoButton tooltip="Next" onClick={next}>
            <Icon name="ArrowDown" />
          </MemoButton>
          <MemoButton tooltip="Previous" onClick={previous}>
            <Icon name="ArrowUp" />
          </MemoButton>
          <div className="text-gray-500 text-sm min-w-10">{result}</div>
        </div>
      </div>
      <MemoButton tooltip="Close" onClick={close}>
        <Icon name="X" />
      </MemoButton>
    </div>
  )
})

SearchAndReplaceMenu.displayName = 'SearchAndReplaceMenu'

export default SearchAndReplaceMenu
