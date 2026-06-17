import { editor } from 'monaco-editor'
import { PropsWithChildren, ReactNode, useMemo, useState, useRef, useCallback } from 'react'
import MonacoEditor, { Monaco, OnChange, OnMount } from '@monaco-editor/react'
import LanguagePicker from 'src/extensions/RunnableCodeBlock/component/LanguagePicker'
import { cn } from 'src/lib/utils'
import { Icon } from '../ui/Icon'
import { Toolbar } from '../ui/Toolbar'
import { useTheme } from '../../providers'

interface CodeEditorProps extends PropsWithChildren {
  value: string
  minHeight?: number
  maxHeight?: number
  collapsible?: boolean
  collapsed?: boolean
  language?: string
  languages?: string[]
  toolbarActions?: ReactNode | undefined
  options?: editor.IStandaloneEditorConstructionOptions
  className?: string
  onMount?: OnMount
  onChange?: OnChange
  onLanguageChange?: (lang: string) => void
  onCollapseToggle?: (collapsed: boolean) => void
}

const CodeEditor = ({
  value,
  children,
  languages,
  toolbarActions,
  options = {},
  minHeight = 40,
  maxHeight = 220,
  collapsed = false,
  language = 'javascript',
  className,
  onMount,
  onChange,
  onLanguageChange,
  onCollapseToggle,
}: CodeEditorProps) => {
  const startY = useRef(0)
  const startHeight = useRef(0)
  const [editorHeight, setEditorHeight] = useState(minHeight)
  const isResizing = useRef(false)
  const editorHeightRef = useRef(minHeight)
  const editorRef = useRef<HTMLDivElement>(null)
  const childrenRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const handleOnMount = (monacoEditor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    if (onMount) {
      onMount(monacoEditor, monaco)
    }

    monacoEditor.onDidContentSizeChange(() => {
      if (isResizing.current) return
      const contentHeight = monacoEditor.getContentHeight()
      const newHeight = Math.max(editorHeightRef.current, maxHeight)
      if (contentHeight > newHeight) {
        setEditorHeight(newHeight)
      } else {
        setEditorHeight(Math.max(contentHeight, editorHeightRef.current))
      }
    })
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!editorRef.current) return

    isResizing.current = true
    startY.current = e.clientY
    startHeight.current = editorRef.current.offsetHeight
    document.body.style.cursor = 'ns-resize'
    if (childrenRef.current) {
      childrenRef.current.style.pointerEvents = 'none'
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!editorRef.current || !isResizing.current) return
      const deltaY = e.clientY - startY.current
      const newHeight = Math.max(minHeight, Math.min(startHeight.current + deltaY, maxHeight * 3))
      setEditorHeight(newHeight)
      editorHeightRef.current = newHeight
    },
    [startY, startHeight, minHeight, maxHeight],
  )

  const handleMouseUp = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = 'default'
    if (childrenRef.current) {
      childrenRef.current.style.pointerEvents = 'auto'
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const editorOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
    return { ...options, ...defaultOptions }
  }, [options])

  return (
    <div
      className={cn(
        'text-sm rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
        className,
      )}
    >
      <div className="flex items-center gap-2 justify-between p-1 border-b border-gray-200 dark:border-neutral-800 flex-wrap">
        {toolbarActions ? (
          toolbarActions
        ) : languages && onLanguageChange && (!languages.length || languages.length > 1) ? (
          <LanguagePicker value={language} languages={languages} onChange={onLanguageChange} />
        ) : null}
        {onCollapseToggle && (
          <Toolbar.Button tooltip={collapsed ? 'Show Code' : 'Hide Code'} onClick={() => onCollapseToggle(!collapsed)}>
            <Icon name="FileCode2" className="text-gray-500 dark:text-neutral-400 inline" />
          </Toolbar.Button>
        )}
      </div>
      {(!onCollapseToggle || !collapsed) && (
        <div ref={editorRef}>
          <MonacoEditor
            value={value}
            loading={null}
            key={language}
            language={language}
            options={editorOptions}
            height={`${editorHeight}px`}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            onChange={onChange}
            onMount={handleOnMount}
          />

          <div
            className="h-2 cursor-ns-resize rounded-full hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 transition-colors mx-1"
            onMouseDown={handleMouseDown}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full" />
            </div>
          </div>
        </div>
      )}
      {children ? (
        <div
          ref={childrenRef}
          className={cn(
            'empty:hidden',
            !collapsed && 'border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  lineNumbersMinChars: 3,
  scrollbar: { alwaysConsumeMouseWheel: false },
}

export default CodeEditor
