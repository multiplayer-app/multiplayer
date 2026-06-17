import debounce from 'lodash.debounce'
import { editor } from 'monaco-editor'
import { Monaco } from '@monaco-editor/react'
import { Editor, NodeViewProps } from '@tiptap/react'
import { useMemo, useRef, useState, useEffect, memo, useCallback } from 'react'
import CodeEditor from 'src/components/CodeEditor'
import { CHART_BLOCK_NAME } from 'src/lib/constants'
import { highlightGlobalVariables, getGlobalState, runById } from '../RunnableCodeBlock/utils'
import { generateGlobalDeclarations, getExtensionOptions, getExtensionStorage } from 'src/lib/utils'
import ChartBlockTabs from './ChartBlockTabs'
import ChartPreview, { getIframeHTML } from './ChartPreview'
import { useGlobals } from 'src/providers'

type ChartBlockProps = Pick<NodeViewProps, 'node' | 'updateAttributes' | 'editor'>

export const ChartBlockView = memo<ChartBlockProps>(({ node, updateAttributes, editor }) => {
  const readOnly = !editor.isEditable
  const { javascript, html, css, title } = node.attrs
  const monacoRef = useRef<Monaco | null>(null)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const {
    aggregatedVariables: variables,
    globalState: { handlers },
  } = useGlobals()
  const [collapsed, setCollapsed] = useState(readOnly)
  const [tab, setTab] = useState<'html' | 'javascript' | 'css'>('javascript')

  const updateHighlighting = () => {
    if (!monacoRef.current || !editorRef.current) return
    const declarations = generateGlobalDeclarations({ variables, handlers }, true)
    monacoRef.current.languages.typescript.javascriptDefaults.addExtraLib(declarations, 'charts/global.d.ts')
    highlightGlobalVariables(editorRef.current, variables, handlers)
  }

  const handleEditorMount = (monacoEditor: editor.IStandaloneCodeEditor, monaco) => {
    monacoRef.current = monaco
    editorRef.current = monacoEditor
    const languageId = monacoEditor.getModel()?.getLanguageId()
    const storage = getExtensionStorage(editor, CHART_BLOCK_NAME)

    if (storage?.focusId === node.attrs._id) {
      storage.focusId = null
      monacoEditor.focus()
      monacoEditor.getDomNode()?.scrollIntoView()
    }

    if (languageId === 'javascript') return

    const debouncedHighlight = debounce(() => {
      updateHighlighting()
    }, 500)

    debouncedHighlight()

    monacoEditor.onDidChangeModelContent(() => {
      debouncedHighlight()
    })

    monacoEditor.onDidDispose(() => {
      debouncedHighlight.cancel()
    })
  }

  const handleEditorChange = useCallback(
    content => {
      updateAttributes({ [tab]: content })
    },
    [updateAttributes, tab],
  )

  const debouncedHandleEditorChange = useMemo(() => debounce(handleEditorChange, 2500), [handleEditorChange])

  useEffect(() => {
    return () => {
      debouncedHandleEditorChange.flush()
    }
  }, [debouncedHandleEditorChange])

  const globalStateString = useMemo(() => {
    return JSON.stringify({ variables, handlers })
  }, [variables, handlers])

  const iframeHTML = useMemo(() => {
    const { variables, handlers } = JSON.parse(globalStateString)
    const filteredHandlers = Object.fromEntries(
      Object.entries(handlers).filter(([key]) => {
        return /^[a-zA-Z0-9_$]+$/.test(key) && javascript.includes(key)
      }),
    )
    const filteredVariables = Object.fromEntries(
      Object.entries(variables).filter(([key]) => {
        return /^[a-zA-Z0-9_$]+$/.test(key) && javascript.includes(key)
      }),
    )

    return getIframeHTML(javascript.trim(), html.trim(), css.trim(), filteredVariables, filteredHandlers)
  }, [javascript, html, css, globalStateString])

  const iframeObjectURL = useMemo(() => {
    const blob = new Blob([iframeHTML], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [iframeHTML])

  const rawContent = useMemo(() => {
    switch (tab) {
      case 'html':
        return html
      case 'javascript':
        return javascript
      case 'css':
        return css
    }
  }, [tab, html, javascript, css])

  const onHandlerRun = useCallback(
    (handler: string, params: Record<string, any>) => {
      return executeHandler(editor, handler, params) ?? Promise.reject(new Error('Handler execution failed'))
    },
    [editor],
  )

  return (
    <div className="chart-block w-full">
      <CodeEditor
        language={tab}
        value={rawContent}
        options={{ readOnly }}
        collapsed={collapsed}
        onMount={handleEditorMount}
        onChange={debouncedHandleEditorChange}
        onCollapseToggle={setCollapsed}
        toolbarActions={
          !readOnly && (
            <>
              <input
                type="text"
                value={title}
                readOnly={readOnly}
                placeholder="Block title"
                className="flex-1 h-6 border-none bg-transparent text-md px-2 font-semibold min-w-[100%] md:min-w-0 text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                onChange={e => updateAttributes({ title: e.target.value })}
              />
              {!collapsed && <ChartBlockTabs tab={tab} onChange={setTab} />}
            </>
          )
        }
      >
        <ChartPreview editor={editor} iframeObjectURL={iframeObjectURL} onHandlerRun={onHandlerRun} />
      </CodeEditor>
    </div>
  )
})

const executeHandler = (editor: Editor, handler: string, params: Record<string, any> = {}) => {
  const { handlers } = getGlobalState(editor.state)
  const options = getExtensionOptions(editor, CHART_BLOCK_NAME)
  const blockId = handlers[handler]
  if (!blockId) {
    throw new Error(`Handler ${handler} not found`)
  }
  const debug = { instance: null, runWithDebugger: false }

  return runById(editor, options.proxy, debug, blockId, params)
}
