import MonacoEditor from '@monaco-editor/react'
import { useState } from 'react'

interface CodeViewProps {
  value: string
  language?: string
  maxHeight?: number
  minHeight?: number
}

const CodeView = ({ value, language, maxHeight = 220, minHeight = 60 }: CodeViewProps) => {
  const [editorHeight, setEditorHeight] = useState(120)
  const handleEditorMount = monacoEditor => {
    monacoEditor.onDidContentSizeChange(() => {
      setEditorHeight(Math.min(Math.max(monacoEditor.getContentHeight(), minHeight), maxHeight))
    })
  }

  return (
    <MonacoEditor
      value={value}
      loading={null}
      language={language}
      className="view-editor"
      onMount={handleEditorMount}
      height={`${editorHeight}px`}
      options={monacoOptions}
    />
  )
}

const monacoOptions: any = {
  wordWrap: 'on',
  readOnly: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  lineNumbersMinChars: 3,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
}

export default CodeView
