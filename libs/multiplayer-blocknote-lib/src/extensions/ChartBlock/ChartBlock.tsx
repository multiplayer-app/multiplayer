import { Node, NodeViewProps, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { generateId, generateGlobalName, generateName } from 'src/lib/utils'

import { CHART_BLOCK_NAME } from 'src/lib/constants'
import { preventDeleteBlock } from 'src/plugins/PreventDeleteOnBackspace'
import { ChartBlockView } from './ChartBlockView'
import { IMultiplayerDebugger } from 'src/types'
import { useTempBlockStyle } from 'src/hooks/useTempBlock'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chartBlock: {
      setChartBlock: (attrs?: Partial<ChartBlockAttributes>) => ReturnType
      updateChartBlockAttributes: (blockId: string, attrs: Partial<ChartBlockAttributes>) => ReturnType
    }
  }
}

export interface ChartBlockAttributes {
  _id: string
  _globalName: string
  title: string
  css: string
  html: string
  javascript: string
  language: string
}

export interface ChartBlockOptions {
  proxy: any
  notebookDebugger: IMultiplayerDebugger | null
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
      <ChartBlockView node={node} updateAttributes={updateAttributes} editor={editor} />
    </NodeViewWrapper>
  )
}

export const ChartBlock = Node.create<ChartBlockOptions>({
  name: CHART_BLOCK_NAME,
  group: 'block',
  atom: true,
  inline: false,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      _id: {
        default: () => generateId(),
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({ 'data-id': attributes._id }),
      },
      _globalName: {
        default: generateName(),
        parseHTML: element => element.getAttribute('data-globalName'),
        renderHTML: attributes => ({ 'data-globalName': attributes._globalName }),
      },
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => ({ 'data-title': attributes.title }),
      },
      css: {
        default: '',
        parseHTML: element => element.getAttribute('data-css'),
        renderHTML: attributes => ({ 'data-css': attributes.css }),
      },
      html: {
        default: '',
        parseHTML: element => element.getAttribute('data-html'),
        renderHTML: attributes => ({ 'data-html': attributes.html }),
      },
      javascript: {
        default: '',
        parseHTML: element => element.getAttribute('data-javascript'),
        renderHTML: attributes => ({ 'data-javascript': attributes.javascript }),
      },
      language: {
        default: 'javascript',
        parseHTML: element => element.getAttribute('data-language'),
        renderHTML: attributes => ({ 'data-language': attributes.language }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chart-block"]',
        getAttrs: (element: HTMLElement) => getParsedHtmlAttributes(element),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chart-block' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(RunnableCodeBlockContent)
  },
  addOptions() {
    return {
      proxy: null,
      notebookDebugger: null,
    }
  },
  addStorage() {
    return { focusId: null }
  },
  addCommands() {
    return {
      setChartBlock:
        (attrs?: Partial<ChartBlockAttributes>) =>
        ({ commands, state }) => {
          const _id = attrs?._id || generateId()
          this.storage.focusId = _id

          return commands.insertContent({
            type: this.name,
            attrs: {
              _id,
              _globalName: attrs?._globalName || generateGlobalName(state, this.name, 'chartBlock'),
              title: attrs?.title || '',
              css: attrs?.css || '',
              html: attrs?.html || '',
              javascript: attrs?.javascript || '',
              language: attrs?.language || 'javascript',
            },
          })
        },
      updateChartBlockAttributes:
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
            console.warn(`Chart block with ID ${blockId} not found.`)
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
    }
  },
  addProseMirrorPlugins() {
    return [preventDeleteBlock('preventDeleteChartBlock')]
  },
})

export function getParsedHtmlAttributes(element: HTMLElement) {
  return {
    _id: element.getAttribute('data-id') || generateId(),
    _globalName: element.getAttribute('data-globalName'),
    title: element.getAttribute('data-title'),
    css: element.getAttribute('data-css'),
    html: element.getAttribute('data-html'),
    javascript: element.getAttribute('data-javascript'),
    language: element.getAttribute('data-language'),
  }
}
