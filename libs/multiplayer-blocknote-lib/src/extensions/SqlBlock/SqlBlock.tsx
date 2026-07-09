import { mergeAttributes, Node, NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

import { copyPastePlugin } from 'src/plugins/CopyPast'
import { SQL_BLOCK_NAME } from 'src/lib/constants'
import { generateId, generateGlobalName, generateName, parsElementAttribute } from 'src/lib/utils'
import { preventDeleteBlock } from 'src/plugins/PreventDeleteOnBackspace'
import { useTempBlockStyle } from 'src/hooks/useTempBlock'

import { setSqlBlockState, sqlBlockPlugin } from './plugins'
import { SqlBlockComponent } from './component'
import {
  createProxySqlExecutor,
  DEFAULT_QUERY,
  executeSqlBlock,
  getParsedHtmlAttributes,
  pastedDataParser,
} from './utils'
import { SqlBlockAttributes, SqlQueryExecutor } from './types'

interface RunSqlBlockOptions {
  signal?: AbortSignal
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    [SQL_BLOCK_NAME]: {
      runSqlBlockById: (blockId: string, options?: RunSqlBlockOptions) => ReturnType
      runSqlBlock: (attrs: SqlBlockAttributes, options?: RunSqlBlockOptions) => ReturnType
      setSqlBlock: (attrs?: Partial<SqlBlockAttributes>) => ReturnType
      updateSqlBlockAttributes: (id: string, attrs: Partial<SqlBlockAttributes>) => ReturnType
    }
  }
}

export interface SqlBlockOptions {
  allowRunnableBlocks: boolean
  sqlProxy?: { apiInstance?: any; path: string }
}

const SqlBlockContent = (props: NodeViewProps) => {
  const { editor, node, HTMLAttributes, updateAttributes } = props
  const tempBlockStyle = useTempBlockStyle(node, editor)
  return (
    <NodeViewWrapper
      className={tempBlockStyle}
      id={HTMLAttributes['data-toc-id']}
      data-toc-id={HTMLAttributes['data-toc-id']}
    >
      <SqlBlockComponent node={node} updateAttributes={updateAttributes} editor={editor} />
    </NodeViewWrapper>
  )
}

export const SqlBlock = Node.create<SqlBlockOptions>({
  name: SQL_BLOCK_NAME,
  group: 'block',
  atom: true,
  inline: false,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      allowRunnableBlocks: false,
      sqlProxy: undefined,
    }
  },

  addStorage() {
    return { focusId: null }
  },

  addAttributes() {
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
      query: {
        default: DEFAULT_QUERY,
        parseHTML: element => parsElementAttribute(element, 'data-query'),
        renderHTML: attributes => ({ 'data-query': attributes.query }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sql-block"]',
        getAttrs: (element: HTMLElement) => getParsedHtmlAttributes(element),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sql-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SqlBlockContent)
  },

  addCommands() {
    const resolveExecutor = (): SqlQueryExecutor => {
      if (!this.options.sqlProxy) {
        throw new Error('SQL backend is not configured')
      }
      return createProxySqlExecutor(this.options.sqlProxy)
    }

    return {
      setSqlBlock:
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
              _runnable: attrs?._runnable ?? true,
              _globalName: attrs?._globalName || generateGlobalName(state, this.name, 'sqlBlock'),
              query: attrs?.query || DEFAULT_QUERY,
            },
          })
        },

      updateSqlBlockAttributes:
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

      runSqlBlock:
        (attrs: SqlBlockAttributes, options: RunSqlBlockOptions = {}) =>
        ({ editor }) => {
          try {
            void executeSqlBlock({
              editor,
              attrs,
              executeQuery: resolveExecutor(),
              signal: options.signal,
            })
            return true
          } catch (error: any) {
            setSqlBlockState(editor.view, attrs._id, {
              running: false,
              result: null,
              error: error?.message ?? 'SQL backend is not configured',
            })
            return false
          }
        },

      runSqlBlockById:
        (blockId: string, options: RunSqlBlockOptions = {}) =>
        ({ editor }) => {
          const { state } = editor
          let found: SqlBlockAttributes | null = null
          state.doc.descendants(node => {
            if (node.attrs._id === blockId) {
              found = node.attrs as SqlBlockAttributes
            }
          })
          if (!found) return false

          try {
            void executeSqlBlock({
              editor,
              attrs: found,
              executeQuery: resolveExecutor(),
              signal: options.signal,
            })
            return true
          } catch (error: any) {
            setSqlBlockState(editor.view, blockId, {
              running: false,
              result: null,
              error: error?.message ?? 'SQL backend is not configured',
            })
            return false
          }
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-f': () => false,
      Backspace: () => false,
      Enter: () => false,
      ArrowDown: () => false,
    }
  },

  addProseMirrorPlugins() {
    return [
      sqlBlockPlugin(),
      copyPastePlugin(this.editor.schema.nodes[SQL_BLOCK_NAME], 'copyPasteSqlPlugin', pastedDataParser),
      preventDeleteBlock('preventDeleteSqlBlock'),
    ]
  },
})
