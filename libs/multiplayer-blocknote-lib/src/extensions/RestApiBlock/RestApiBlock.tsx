import { mergeAttributes, Node, NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { BlocknoteTemplates } from '@multiplayer/entity'

import { copyPastePlugin } from 'src/plugins/CopyPast'
import { RUNNABLE_API_BLOCK_NAME } from 'src/lib/constants'
import { generateName, generateGlobalName, generateId, parsElementAttribute } from 'src/lib/utils'
import { executeBlock, getParsedHtmlAttributes, pastedDataParser } from './utils'

import { apiBlockPlugin } from './plugins'

import { RestApiBlockComponent } from './component'

import { Notebook } from '@multiplayer/types'
import { preventDeleteBlock } from 'src/plugins/PreventDeleteOnBackspace'
import { IMultiplayerDebugger, ISecretsManager } from 'src/types'
import { useTempBlockStyle } from 'src/hooks/useTempBlock'

interface RunApiBlockOptions {
  signal?: AbortSignal
  runWithDebugger?: boolean
  dynamicParams?: Record<string, string>
}
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [RUNNABLE_API_BLOCK_NAME]: {
      runApiBlockById: (_id: string, options?: RunApiBlockOptions) => void
      runApiBlock: (attrs: Notebook.RestApiBlockAttributes, options?: RunApiBlockOptions) => void
      setRestApiBlock: (attrs?: Partial<Notebook.RestApiBlockAttributes>) => ReturnType
      updateRestApiBlockAttributes: (id: string, attrs: Partial<Notebook.RestApiBlockAttributes>) => ReturnType
    }
  }
}

export interface RestApiBlockOptions {
  proxy?: any
  allowRunnableBlocks: boolean
  notebookDebugger: IMultiplayerDebugger | null
  secretsManager: ISecretsManager | null
}

const RestApiBlockContent = (props: NodeViewProps) => {
  const { editor, node, HTMLAttributes, updateAttributes } = props
  const tempBlockStyle = useTempBlockStyle(node, editor)

  return (
    <NodeViewWrapper
      className={tempBlockStyle}
      id={HTMLAttributes['data-toc-id']}
      data-toc-id={HTMLAttributes['data-toc-id']}
    >
      <RestApiBlockComponent node={node} updateAttributes={updateAttributes} editor={editor} />
    </NodeViewWrapper>
  )
}

export const RestApiBlock = Node.create<RestApiBlockOptions>({
  name: RUNNABLE_API_BLOCK_NAME,
  group: 'block',
  atom: true,
  inline: false,
  draggable: true,
  selectable: true,

  addOptions() {
    return { proxy: null, notebookDebugger: null, allowRunnableBlocks: false, secretsManager: null }
  },

  addStorage() {
    return { focusId: null }
  },

  addAttributes() {
    const emptyBlock = BlocknoteTemplates.emptyApiBlock()
    return {
      _id: {
        default: () => generateId(),
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({ id: attributes._id, 'data-id': attributes._id }),
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

      url: {
        default: emptyBlock.url,
        parseHTML: element => parsElementAttribute(element, 'data-url'),
        renderHTML: attributes => ({ 'data-url': attributes.url }),
      },
      method: {
        default: emptyBlock.method,
        parseHTML: element => parsElementAttribute(element, 'data-method'),
        renderHTML: attributes => ({ 'data-method': attributes.method }),
      },
      body: {
        default: emptyBlock.body,
        parseHTML: element => parsElementAttribute(element, 'data-body'),
        renderHTML: attributes => ({ 'data-body': JSON.stringify(attributes.body) }),
      },
      headers: {
        default: emptyBlock.headers,
        parseHTML: element => parsElementAttribute(element, 'data-headers'),
        renderHTML: attributes => ({ 'data-headers': JSON.stringify(attributes.headers) }),
      },
      variables: {
        default: emptyBlock.variables,
        parseHTML: element => parsElementAttribute(element, 'data-variables'),
        renderHTML: attributes => ({ 'data-variables': JSON.stringify(attributes.variables) }),
      },
      parameters: {
        default: emptyBlock.parameters,
        parseHTML: element => parsElementAttribute(element, 'data-parameters'),
        renderHTML: attributes => ({ 'data-parameters': JSON.stringify(attributes.parameters) }),
      },
      authorization: {
        default: emptyBlock.authorization,
        parseHTML: element => parsElementAttribute(element, 'data-authorization'),
        renderHTML: attributes => ({ 'data-authorization': JSON.stringify(attributes.authorization) }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="rest-api-block"]',
        getAttrs: (element: HTMLElement) => getParsedHtmlAttributes(element),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'rest-api-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RestApiBlockContent)
  },

  addCommands() {
    return {
      setRestApiBlock:
        (attrs?: Partial<Notebook.RestApiBlockAttributes>) =>
        ({ commands, state }) => {
          if (!this.options.allowRunnableBlocks) {
            return false
          }
          const emptyBlock = BlocknoteTemplates.emptyApiBlock(generateGlobalName(state, this.name, 'apiBlock'))

          const _id = attrs?._id || emptyBlock._id

          this.storage.focusId = _id

          return commands.insertContent({
            type: this.name,
            attrs: {
              _id,
              _runnable: attrs?._runnable || true,
              _globalName: attrs?._globalName || emptyBlock._globalName,

              url: attrs?.url || emptyBlock.url,
              body: attrs?.body || emptyBlock.body,
              method: attrs?.method || emptyBlock.method,
              headers: attrs?.headers || emptyBlock.headers,
              variables: attrs?.variables || emptyBlock.variables,
              parameters: attrs?.parameters || emptyBlock.parameters,
              authorization: attrs?.authorization || emptyBlock.authorization,
            },
          })
        },

      updateRestApiBlockAttributes:
        (blockId: string, attrs: Partial<Notebook.RestApiBlockAttributes>) =>
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
            console.warn(`Api block with ID ${blockId} not found.`)
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

      runApiBlock:
        (attrs: Notebook.RestApiBlockAttributes, options: RunApiBlockOptions = {}) =>
        async ({ editor }) => {
          const { runWithDebugger, dynamicParams, signal } = options
          const debug = { instance: this.options.notebookDebugger, runWithDebugger: !!runWithDebugger }
          return executeBlock({
            editor,
            attrs,
            proxy: this.options.proxy,
            debug,
            dynamicParams,
            signal,
            secretsManager: this.options.secretsManager,
          })
        },

      runApiBlockById:
        (blockId: string, options: RunApiBlockOptions = {}) =>
        async ({ editor }) => {
          const { state } = editor
          const node = state.doc.descendants(node => node.attrs._id === blockId && node)
          if (!node) return
          const { runWithDebugger, dynamicParams, signal } = options
          const debug = { instance: this.options.notebookDebugger, runWithDebugger: !!runWithDebugger }
          return executeBlock({
            editor,
            attrs: node.attrs,
            proxy: this.options.proxy,
            debug,
            dynamicParams,
            signal,
            secretsManager: this.options.secretsManager,
          })
        },
    }
  },
  addProseMirrorPlugins() {
    return [
      apiBlockPlugin(),
      copyPastePlugin(this.editor.schema.nodes[RUNNABLE_API_BLOCK_NAME], 'copyPasteApiPlugin', pastedDataParser),
      preventDeleteBlock('preventDeleteRestApiBlock'),
    ]
  },
})
