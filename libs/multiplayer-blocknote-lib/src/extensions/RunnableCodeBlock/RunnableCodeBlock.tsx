import type { editor } from 'monaco-editor'
import CodeBlock from '@tiptap/extension-code-block'
import { mergeAttributes, Node, NodeViewProps } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

import { copyPastePlugin } from 'src/plugins/CopyPast'
import { RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { generateId, generateName, generateGlobalName, parsElementAttribute } from 'src/lib/utils'

import { codeBlockPlugin } from './plugins'
import { runnableLanguages } from './configs'
import { RunnableCodeBlockAttributes } from './types'
import { RunnableCodeBlockComponent } from './component'
import { getParsedHtmlAttributes, pastedDataParser, executeBlock } from './utils'
import { preventDeleteBlock } from 'src/plugins/PreventDeleteOnBackspace'
import { IMultiplayerDebugger, ISecretsManager } from 'src/types'
import { useTempBlockStyle } from 'src/hooks/useTempBlock'

interface RunCodeBlockOptions {
  runWithDebugger?: boolean
  signal?: AbortSignal
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [RUNNABLE_CODE_BLOCK_NAME]: {
      runCodeBlockById: (blockId: string, options?: RunCodeBlockOptions) => any
      runCodeBlock: (attrs: RunnableCodeBlockAttributes, options?: RunCodeBlockOptions) => any
      setRunnableCodeBlock: (attrs?: Partial<RunnableCodeBlockAttributes>) => ReturnType
      updateRunnableCodeBlockAttributes: (id: string, attrs: Partial<RunnableCodeBlockAttributes>) => ReturnType
    }
  }
}

export interface RunnableCodeBlockOptions {
  proxy: any | null
  languages?: string[]
  defaultLanguage: string
  allowRunnableBlocks: boolean
  notebookDebugger: IMultiplayerDebugger | null
  secretsManager: ISecretsManager | null
  editorOptions?: editor.IStandaloneEditorConstructionOptions
}

const RunnableCodeBlockContent = (props: NodeViewProps) => {
  const { editor, node, HTMLAttributes, updateAttributes } = props
  const tempBlockStyle = useTempBlockStyle(node, editor)
  return (
    <NodeViewWrapper
      className={tempBlockStyle}
      id={HTMLAttributes['data-toc-id']}
      data-toc-id={HTMLAttributes['data-toc-id']}
    >
      <RunnableCodeBlockComponent node={node} updateAttributes={updateAttributes} editor={editor} />
    </NodeViewWrapper>
  )
}

export const RunnableCodeBlock = Node.create<RunnableCodeBlockOptions>({
  name: RUNNABLE_CODE_BLOCK_NAME,
  group: 'block',
  atom: true,
  inline: false,
  draggable: true,
  selectable: true,
  addOptions() {
    return {
      proxy: null,
      languages: [],
      editorOptions: {},
      notebookDebugger: null,
      defaultLanguage: 'javascript',
      allowRunnableBlocks: false,
      secretsManager: null,
    }
  },
  addStorage() {
    return { focusId: null }
  },
  addAttributes() {
    const { defaultLanguage, languages } = this.options
    const optLanguage = defaultLanguage || (languages && languages[0])
    return {
      _id: {
        default: () => generateId(),
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({ 'data-id': attributes._id }),
      },
      _runnable: {
        default: true,
        parseHTML: element => element.getAttribute('data-runnable'),
        renderHTML: attributes => ({ 'data-runnable': attributes._runnable }),
      },
      _globalName: {
        default: generateName(),
        parseHTML: element => element.getAttribute('data-globalName'),
        renderHTML: attributes => ({ 'data-globalName': attributes._globalName }),
      },

      content: {
        default: '',
        parseHTML: element => parsElementAttribute(element, 'data-content'),
        renderHTML: attributes => ({ 'data-content': attributes.content }),
      },
      language: {
        default: optLanguage || 'javascript',
        parseHTML: element => parsElementAttribute(element, 'data-language'),
        renderHTML: attributes => ({ 'data-language': attributes.language }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="runnable-code-block"]',
        getAttrs: (element: HTMLElement) => getParsedHtmlAttributes(element),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'runnable-code-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RunnableCodeBlockContent)
  },

  addCommands() {
    return {
      setRunnableCodeBlock:
        attrs =>
        ({ commands, state }) => {
          if (!this.options.allowRunnableBlocks) {
            return false
          }
          const _id = attrs?._id || generateId()
          this.storage.focusId = _id

          return commands.insertContent({
            type: this.name,
            attrs: {
              _id,
              _runnable: attrs?._runnable || true,
              _globalName: attrs?._globalName || generateGlobalName(state, this.name, 'codeBlock'),

              content: attrs?.content || '',
              language: attrs?.language || this.options.defaultLanguage,
            },
          })
        },
      updateRunnableCodeBlockAttributes:
        (blockId, attrs) =>
        ({ state, dispatch }) => {
          let targetPos: number | null = null

          state.doc.descendants((node, pos) => {
            if (node.attrs._id === blockId) {
              targetPos = pos
              return true
            }
            return false
          })

          if (targetPos === null) {
            console.warn(`Runnable code block with ID ${blockId} not found.`)
            return false
          }

          const tr = state.tr.setNodeMarkup(targetPos, undefined, {
            ...(state.doc.nodeAt(targetPos)?.attrs || {}),
            ...attrs,
          })

          if (dispatch) {
            dispatch(tr)
          }

          return true
        },

      runCodeBlock:
        (attrs: RunnableCodeBlockAttributes, options: RunCodeBlockOptions = {}) =>
        async ({ editor }) => {
          const { runWithDebugger, signal } = options
          const debug = { instance: this.options.notebookDebugger, runWithDebugger: !!runWithDebugger }
          return executeBlock({
            editor,
            attrs,
            debug,
            proxy: this.options.proxy,
            signal,
            secretsManager: this.options.secretsManager,
          })
        },

      runCodeBlockById:
        (blockId: string, options: RunCodeBlockOptions = {}) =>
        async ({ editor }) => {
          const { state } = editor
          const node = state.doc.descendants(n => n.attrs._id === blockId)
          if (!node) return
          const { runWithDebugger, signal } = options
          const debug = { instance: this.options.notebookDebugger, runWithDebugger: !!runWithDebugger }
          return executeBlock({
            editor,
            attrs: node.attrs,
            debug,
            proxy: this.options.proxy,
            signal,
            secretsManager: this.options.secretsManager,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-f': () => {
        return false
      },
      Backspace: () => {
        return false
      },
      Enter: () => {
        return false
      },
      ArrowDown: () => {
        return false
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      codeBlockPlugin(),
      copyPastePlugin(this.editor.schema.nodes[RUNNABLE_CODE_BLOCK_NAME], 'copyPasteCodePlugin', pastedDataParser),
      preventDeleteBlock('preventDeleteCodeBlock'),
      new Plugin({
        key: new PluginKey('runnableCodeBlockVSCodeHandler'),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData) {
              return false
            }
            if (this.editor.isActive(this.type.name) || this.editor.isActive(CodeBlock.name)) {
              return false
            }
            const text = event.clipboardData.getData('text/plain')
            const vscode = event.clipboardData.getData('vscode-editor-data')
            const vscodeData = vscode ? JSON.parse(vscode) : undefined
            const language = vscodeData?.mode

            if (!text || !runnableLanguages.includes(language)) {
              return false
            }

            const { tr, schema } = view.state
            const textNode = schema.text(text.replace(/\r\n?/g, '\n'))
            const newNode: RunnableCodeBlockAttributes = {
              language,
              content: textNode.textContent,
              _id: generateId(),
              _runnable: true,
              _globalName: generateGlobalName(this.editor.state, this.name, 'codeBlock'),
            }

            tr.replaceSelectionWith(this.type.create(newNode))
            tr.setMeta('paste', true)

            view.dispatch(tr)

            return true
          },
        },
      }),
    ]
  },
})
