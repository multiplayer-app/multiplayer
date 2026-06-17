import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { EditorContent } from '@tiptap/react'

import { TiptapProps, BlockEditorRef } from './types'
import { LinkMenu } from '../menus'
import { TextMenu } from '../menus/TextMenu'
import { ColumnsMenu } from '../../extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '../../extensions/Table/menus'
import ImageBlockMenu from '../../extensions/ImageBlock/components/ImageBlockMenu'
import SearchAndReplaceMenu from '../menus/SearchAndReplaceMenu'

import { ThemeProvider, VariablesProvider } from 'src/providers'

import { TableOfContents } from '../TableOfContents'
import PlaceholderBlock from '../PlaceholderBlock'
import { cn, getExtensionOptions } from 'src/lib/utils'

export const BlockEditor = forwardRef<BlockEditorRef, TiptapProps>((options, ref) => {
  const { editor, children, customBlockExclusions, theme } = options
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollListenersRef = useRef<Set<(event: Event) => void>>(new Set())

  const { allowRunnableBlocks, secretsManager } = useMemo(
    () => getExtensionOptions(editor, 'runnableBlocksContext'),
    [editor],
  )

  // Expose scroll container functionality through imperative handle
  useImperativeHandle(
    ref,
    () => ({
      get scrollContainer() {
        return scrollContainerRef.current
      },
      scrollTo: (options: ScrollToOptions) => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo(options)
        }
      },
      getScrollPosition: () => {
        if (scrollContainerRef.current) {
          return {
            scrollTop: scrollContainerRef.current.scrollTop,
            scrollHeight: scrollContainerRef.current.scrollHeight,
            clientHeight: scrollContainerRef.current.clientHeight,
          }
        }
        return { scrollTop: 0, scrollHeight: 0, clientHeight: 0 }
      },
      addScrollListener: (listener: (event: Event) => void) => {
        scrollListenersRef.current.add(listener)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.addEventListener('scroll', listener)
        }
      },
      removeScrollListener: (listener: (event: Event) => void) => {
        scrollListenersRef.current.delete(listener)
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener('scroll', listener)
        }
      },
    }),
    [],
  )

  useEffect(() => {
    if (editor && scrollContainerRef.current) {
      editor.extensionManager.extensions.forEach(extension => {
        if (extension.name === 'tableOfContents' && extension.options) {
          extension.options.scrollParent = scrollContainerRef.current
        }
      })
    }
  }, [editor])

  useEffect(() => {
    scrollListenersRef.current.forEach(listener => {
      scrollContainerRef.current?.addEventListener('scroll', listener)
    })

    return () => {
      scrollListenersRef.current.forEach(listener => {
        scrollContainerRef.current?.removeEventListener('scroll', listener)
      })
    }
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div ref={menuContainerRef} className={cn('flex flex-1 min-w-0 relative', theme === 'dark' ? 'dark' : undefined)}>
      <ThemeProvider theme={theme}>
        <VariablesProvider editor={editor} secretsManager={secretsManager}>
          <TableOfContents editor={editor} />
          <div
            ref={scrollContainerRef}
            className={cn('flex-1 min-w-0 overflow-auto', !allowRunnableBlocks ? 'pb-10' : 'pb-0')}
          >
            <EditorContent editor={editor}>{children}</EditorContent>
            {allowRunnableBlocks && <PlaceholderBlock editor={editor} />}
          </div>
          <TextMenu editor={editor} customBlockExclusions={customBlockExclusions} />
          <SearchAndReplaceMenu editor={editor} appendTo={menuContainerRef} />
          <LinkMenu editor={editor} appendTo={menuContainerRef} />
          <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
          <TableRowMenu editor={editor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
        </VariablesProvider>
      </ThemeProvider>
    </div>
  )
})

export default BlockEditor
