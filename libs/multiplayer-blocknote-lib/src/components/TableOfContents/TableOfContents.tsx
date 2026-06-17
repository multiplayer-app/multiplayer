import { useEditorState } from '@tiptap/react'
import { Editor as CoreEditor } from '@tiptap/core'
import { memo, useEffect, useRef, useState } from 'react'

import { cn } from 'src/lib/utils'

export type TableOfContentsProps = {
  editor: CoreEditor
  onItemClick?: () => void
}

export const TableOfContents = memo(({ editor, onItemClick }: TableOfContentsProps) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const content = useEditorState({
    editor,
    selector: ctx => ctx.editor.storage.tableOfContents.content,
    equalityFn: (a, b) => a === b,
  })
  const showOutline = useEditorState({
    editor,
    selector: ctx => ctx.editor.storage.tableOfContents.showOutline,
    equalityFn: (a, b) => a === b,
  })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (content.length && showOutline) {
      const domElements = content.filter(c => c.dom).map(c => c.dom)
      const handleIntersection = () => {
        requestAnimationFrame(() => {
          const intersectingBlocks = getVisibleElements(domElements, 150)
          if (intersectingBlocks.length > 0) {
            setActiveId(intersectingBlocks[0].id)
          }
        })
      }

      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '0px',
        threshold: 0.5,
      })

      domElements.forEach(item => {
        observerRef.current?.observe(item)
      })
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [content, showOutline])
  if (!showOutline) return null
  return (
    <div ref={nodeRef} className="p-4 flex flex-col w-[320px] overflow-auto whitespace-nowrap">
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">Outline</div>
      {content.length > 0 ? (
        <div className="flex flex-col">
          {content.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={onItemClick}
              data-toc-id={item.id}
              className="flex items-center gap-3 py-2 text-sm"
              style={{ paddingLeft: `${1 * item.level - 1}rem` }}
            >
              <span
                className={cn(
                  'min-w-1 w-1 h-1 rounded bg-gray-400',
                  item.id === activeId ? 'scale-[2] bg-gray-600' : '',
                )}
              />
              {item.tagStyle ? (
                <span
                  className="flex-grow-1 min-w-0 text-xs truncate px-2 py-1 rounded-lg border border-[0.5px]"
                  style={item.tagStyle}
                >
                  {item.textContent}
                </span>
              ) : (
                <span className="flex-grow-1 truncate text-neutral-700">{item.textContent}</span>
              )}
              <span className="text-neutral-500 ml-auto text-xs">{item.label}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-500 whitespace-normal">
          Start adding headings, API blocks, or code blocks to structure your document.
        </div>
      )}
    </div>
  )
})

const getVisibleElements = (elements: HTMLElement[], parentOffset = 160) => {
  const visibleElements = elements
    .map(el => {
      const rect = el.getBoundingClientRect()
      const absoluteTop = el.offsetTop - parentOffset
      const isVisible = rect.top >= parentOffset && rect.top < window.innerHeight

      return isVisible ? { id: el.id, top: absoluteTop } : null
    })
    .filter(Boolean) as { id: string; top: number }[]

  return visibleElements.sort((a, b) => a.top - b.top)
}

TableOfContents.displayName = 'TableOfContents'
