import { NodeViewProps } from '@tiptap/react'
import { memo, useCallback, useEffect, useRef } from 'react'
import { editor } from 'monaco-editor'
import { Monaco } from '@monaco-editor/react'

import { Icon } from 'src/components/ui/Icon'
import GlobalName from 'src/components/GlobalName'
import CodeEditor from 'src/components/CodeEditor'
import { getExtensionStorage } from 'src/lib/utils'
import { SQL_BLOCK_NAME } from 'src/lib/constants'

import { SqlBlockAttributes } from '../types'
import { setSqlBlockState } from '../plugins'
import SqlBlockProvider from './SqlBlockContext'
import SqlBlockResult from './SqlBlockResult'
import RunSqlBlockButton from './RunSqlBlockButton'

type SqlBlockComponentProps = Pick<NodeViewProps, 'node' | 'updateAttributes' | 'editor'>

export const SqlBlockComponent = memo<SqlBlockComponentProps>(({ node, updateAttributes, editor }) => {
  const readOnly = !editor.isEditable
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleQueryChange = useCallback(
    (query: string | undefined) => {
      updateAttributes({ query: query ?? '' })
    },
    [updateAttributes],
  )

  const handleEditorMount = (monacoEditor: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
    editorRef.current = monacoEditor
    const storage = getExtensionStorage(editor, SQL_BLOCK_NAME)

    if (storage?.focusId === node.attrs._id) {
      storage.focusId = null
      monacoEditor.getDomNode()?.scrollIntoView()
      monacoEditor.focus()
    }
  }

  const onNameChange = useCallback(
    (_globalName: string) => {
      updateAttributes({ _globalName })
    },
    [updateAttributes],
  )

  useEffect(() => {
    setSqlBlockState(editor.view, node.attrs._id, { globalName: node.attrs._globalName })
  }, [editor.view, node.attrs._id, node.attrs._globalName])

  return (
    <SqlBlockProvider attrs={node.attrs as SqlBlockAttributes} editor={editor}>
      {node.attrs._runnable && (
        <GlobalName editor={editor} node={node} name={node.attrs._globalName} onChange={onNameChange} />
      )}
      <CodeEditor
        language="sql"
        value={node.attrs.query}
        onMount={handleEditorMount}
        onChange={handleQueryChange}
        options={{ readOnly }}
        toolbarActions={
          node.attrs._runnable && (
            <>
              <div className="flex items-center px-2 gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                <Icon name="Database" />
                SQL
              </div>
              <RunSqlBlockButton node={node} editor={editor} />
            </>
          )
        }
      >
        <SqlBlockResult />
      </CodeEditor>
    </SqlBlockProvider>
  )
})
