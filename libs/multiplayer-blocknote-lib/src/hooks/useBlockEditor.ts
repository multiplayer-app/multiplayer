import { DependencyList } from 'react'
import { useEditor } from '@tiptap/react'
import { BlockEditorOptions } from 'src/types'
import ExtensionKit from '../extensions/extension-kit'

export const useBlockEditor = (options: Partial<BlockEditorOptions>, deps?: DependencyList) => {
  const {
    user,
    proxy,
    environments,
    aiAssistant,
    sqlProxy,
    showOutline,
    collaboration,
    allowComments,
    secretsManager,
    notebookDebugger,
    allowRunnableBlocks,
    allowApiBlocks,
    extensions,
    ...rest
  } = options

  const editor = useEditor(
    {
      autofocus: true,
      editorProps: { attributes: { autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off' } },
      ...rest,
      extensions: [
        ...ExtensionKit({
          user,
          proxy,
          aiAssistant,
          sqlProxy,
          environments,
          showOutline,
          allowComments,
          collaboration,
          secretsManager,
          notebookDebugger,
          allowRunnableBlocks,
          allowApiBlocks,
        }),
        ...(extensions || []),
      ],
    },
    deps,
  )

  return editor
}

export default useBlockEditor
