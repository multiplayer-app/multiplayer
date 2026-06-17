import { Notebook } from '@multiplayer/types'
import { EditorContent, useEditor } from '@tiptap/react'
import { Document, Text, Columns, Column, CodeBlock } from 'src/extensions'

interface JSONInputProps {
  name: string
  value: string
  onChange: (e: { target: { value: string; name: string } }) => void
}

const JSONInput = ({ name, value, onChange }: JSONInputProps) => {
  const codeEditor = useEditor({
    extensions: [
      Text,
      Column,
      Columns,
      Document,
      CodeBlock.configure({
        defaultLanguage: Notebook.RawContentLang.JSON,
      }),
    ],
    content: `<pre><code>${value}</code></pre>`,
    onUpdate: ({ editor }) => {
      onChange({
        target: { name, value: editor.getText() },
      })
    },
  })
  return <EditorContent editor={codeEditor} className="nested-code-editor" />
}

export default JSONInput
