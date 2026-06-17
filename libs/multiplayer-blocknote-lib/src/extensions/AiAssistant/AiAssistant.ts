import { Editor, Extension } from '@tiptap/core'
import { CHART_BLOCK_NAME, RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { generateId, generateUniqueName, moveCursorToEnd } from 'src/lib/utils'

interface AiAssistantOptions {
  path: string
  apiInstance: any
}

interface AiAssistantStorage {
  blocks: Record<string, string>
  tempBlocks: Record<string, string>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiAssistant: {
      acceptBlock: (blockId: string) => ReturnType
      rejectBlock: (blockId: string) => ReturnType
      generateBlock: (message: string, signal?: AbortSignal) => any
      adjustBlock: (payload: { block: any; adjustmentMessage: string; message?: string }, signal?: AbortSignal) => any
    }
  }
}

export const AiAssistant = Extension.create<AiAssistantOptions>({
  name: 'aiAssistant',

  addOptions() {
    return {
      path: '',
      apiInstance: null,
    }
  },

  addStorage(): AiAssistantStorage {
    return {
      blocks: {},
      tempBlocks: {},
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: blockTypes,
        attributes: {
          'data-ai-id': {
            default: null,
            parseHTML: el => el.getAttribute('data-ai-id'),
            renderHTML: attrs => (attrs['data-ai-id'] ? { 'data-ai-id': attrs['data-ai-id'] } : {}),
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      generateBlock:
        (message: string, signal?: AbortSignal) =>
        async ({ editor }) => {
          const { apiInstance, path } = this.options
          if (!apiInstance) {
            console.error('[AiAssistant] No API instance provided')
            return { error: 'No API instance provided' }
          }

          try {
            const id = generateId()
            const response = await apiInstance.post(path, { message }, { signal })
            if (!response?.type) return { error: 'Invalid response from API please try again' }

            const block = enrichBlockWithId(id, response)
            this.storage.tempBlocks[id] = block
            insertBlock(block, editor)
            return block
          } catch (error: any) {
            return handleError(error)
          }
        },

      adjustBlock:
        ({ block, adjustmentMessage, message }, signal?: AbortSignal) =>
        async ({ editor }) => {
          try {
            const { apiInstance, path } = this.options
            const response = await apiInstance.post(path, { block, adjustmentMessage, message }, { signal })
            const { attrs: { _id, _globalName, ...attrs } = {}, ...rest } = response
            // temporary fix of block name and changes on adjustment
            const update = {
              ...rest,
              attrs: { ...(block.attrs || {}), ...attrs },
            }
            updateNodeById(editor, update.attrs._id, update)
            return update
          } catch (error: any) {
            return handleError(error)
          }
        },
      acceptBlock:
        (blockId: string) =>
        ({ editor, chain }) => {
          let found = false
          editor.state.doc.descendants((node, pos) => {
            const id = node.attrs['_id'] || node.attrs['data-ai-id']
            if (id === blockId) {
              found = true
              chain().setNodeSelection(pos).resetAttributes(node.type.name, ['data-ai-id']).run()
            }
          })
          delete this.storage.tempBlocks[blockId]
          return found
        },

      rejectBlock:
        (blockId: string) =>
        ({ editor, chain }) => {
          let found = false
          editor.state.doc.descendants((node, pos) => {
            const id = node.attrs['_id'] || node.attrs['data-ai-id']
            if (id === blockId) {
              found = true
              chain().setNodeSelection(pos).deleteSelection().run()
            }
          })
          delete this.storage.tempBlocks[blockId]
          return found
        },
    }
  },
})

// --- Helpers ---
function handleError(error: any) {
  let errorMessage = error?.message || 'Unknown error'

  if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
    errorMessage = 'Request was cancelled'
  }
  return { error: errorMessage }
}

function enrichBlockWithId(id: string, response: any) {
  return {
    ...response,
    attrs: {
      ...(response.attrs || {}),
      _id: id,
      'data-ai-id': id,
    },
  }
}

function insertBlock(block: any, editor: Editor) {
  const { type, attrs } = block
  if (attrs.hasOwnProperty('_globalName')) {
    attrs._globalName = generateUniqueName(attrs._globalName, editor.state)
  }
  moveCursorToEnd(editor)
  switch (type) {
    case RUNNABLE_CODE_BLOCK_NAME:
      editor.commands.setRunnableCodeBlock(attrs)
      break
    case RUNNABLE_API_BLOCK_NAME:
      editor.commands.setRestApiBlock(attrs)
      break
    case CHART_BLOCK_NAME:
      editor.commands.setChartBlock(attrs)
      break
    default:
      editor.chain().focus().insertContent(block).run()
  }
}

function updateNodeById(
  editor: Editor,
  id: string,
  update: Partial<{
    attrs: Record<string, any> | ((attrs: Record<string, any>) => Record<string, any>)
    content?: any
  }>,
): boolean {
  let posToUpdate: number | null = null
  let nodeType: string | null = null
  let currentAttrs: Record<string, any> = {}

  editor.state.doc.descendants((node, pos) => {
    const nodeId = node.attrs['_id'] || node.attrs['data-ai-id']
    if (nodeId === id && posToUpdate === null) {
      posToUpdate = pos
      nodeType = node.type.name
      currentAttrs = node.attrs
    }
  })

  if (posToUpdate !== null && nodeType) {
    const { attrs, content } = update
    const nextAttrs = typeof attrs === 'function' ? attrs(currentAttrs) : attrs ?? currentAttrs
    const chain = editor.chain().focus().setNodeSelection(posToUpdate)

    if (content) {
      chain.deleteSelection()
      chain.insertContentAt(posToUpdate, {
        type: nodeType,
        content,
      })
    }
    if (nextAttrs) {
      chain.updateAttributes(nodeType, nextAttrs)
    }
    chain.run()
    return true
  }

  return false
}

const blockTypes = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'code',
  'codeBlock',
  'table',
]
