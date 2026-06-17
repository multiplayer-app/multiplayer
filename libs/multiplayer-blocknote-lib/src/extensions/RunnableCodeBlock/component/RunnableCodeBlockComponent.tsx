import { Monaco } from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import debounce from 'lodash.debounce'
import { NodeViewProps } from '@tiptap/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Icon } from 'src/components/ui/Icon'
import GlobalName from 'src/components/GlobalName'
import { generateGlobalDeclarations, getExtensionOptions, getExtensionStorage } from 'src/lib/utils'
import { RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'

import { setCodeBlockState } from '../plugins'
import { RunnableCodeBlockAttributes } from '../types'
import { getGlobalState, highlightGlobalVariables } from '../utils'

import CodeBlockResult from './CodeBlockResult'
import RunBlockButton from './RunCodeBlockButton/RunCodeBlockButton'
import RunnableCodeBlockProvider from './RunnableCodeBlockContext'
import CodeEditor from 'src/components/CodeEditor'

type RunnableCodeBlockComponentProps = Pick<NodeViewProps, 'node' | 'updateAttributes' | 'editor'>

export const RunnableCodeBlockComponent = memo<RunnableCodeBlockComponentProps>(
  ({ node, updateAttributes, editor }) => {
    const readOnly = !editor.isEditable
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const [language, setLanguage] = useState(node.attrs.language)

    const { languages, notebookDebugger } = useMemo(() => {
      return getExtensionOptions(editor, RUNNABLE_CODE_BLOCK_NAME)
    }, [editor])

    const handleLanguageChange = (language: string) => {
      if (readOnly) return
      setLanguage(language)
      updateAttributes({ language })
    }

    const handleEditorChange = content => {
      updateAttributes({ content })
    }

    const updateHighlighting = globalState => {
      if (!monacoRef.current || !editorRef.current || !node.attrs._runnable) return
      const declarations = generateGlobalDeclarations(globalState)
      monacoRef.current.languages.typescript.javascriptDefaults.addExtraLib(declarations, 'filename/global.d.ts')
      highlightGlobalVariables(editorRef.current, globalState.variables, globalState.handlers)
    }

    const handleEditorMount = (monacoEditor: editor.IStandaloneCodeEditor, monaco) => {
      monacoRef.current = monaco
      editorRef.current = monacoEditor

      const storage = getExtensionStorage(editor, RUNNABLE_CODE_BLOCK_NAME)

      if (storage?.focusId === node.attrs._id) {
        storage.focusId = null
        monacoEditor.getDomNode()?.scrollIntoView()
        monacoEditor.focus()
      }

      if (node.attrs._runnable) {
        const debouncedHighlight = debounce(() => {
          const state = getGlobalState(editor.state)
          updateHighlighting(state)
        }, 200)

        debouncedHighlight()

        monacoEditor.onDidChangeModelContent(() => {
          debouncedHighlight()
        })

        monacoEditor.onDidDispose(() => {
          debouncedHighlight.cancel()
        })
      }
    }

    const onNameChange = useCallback(
      (_globalName: string) => {
        updateAttributes({ _globalName })
      },
      [updateAttributes],
    )

    useEffect(() => {
      setCodeBlockState(editor.view, node.attrs._id, { globalName: node.attrs._globalName })
    }, [editor.view, node.attrs._id, node.attrs._globalName])

    return (
      <RunnableCodeBlockProvider attrs={node.attrs as RunnableCodeBlockAttributes} editor={editor}>
        {node.attrs._runnable && (
          <GlobalName editor={editor} node={node} name={node.attrs._globalName} onChange={onNameChange} />
        )}
        <CodeEditor
          language={language}
          languages={languages}
          value={node.attrs.content}
          onMount={handleEditorMount}
          onChange={handleEditorChange}
          onLanguageChange={handleLanguageChange}
          options={{ readOnly }}
          toolbarActions={
            node.attrs._runnable && (
              <>
                <div className="flex items-center px-2 gap-2 text-sm">
                  <Icon name="SquareTerminal" />
                  Javascript
                </div>
                <RunBlockButton node={node} editor={editor} hasDebugger={!!notebookDebugger} />
              </>
            )
          }
        >
          {node.attrs._runnable && <CodeBlockResult />}
        </CodeEditor>
      </RunnableCodeBlockProvider>
    )
  },
)
