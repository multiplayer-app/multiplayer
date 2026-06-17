import { v4 as uuidv4 } from 'uuid'
import { Extension } from '@tiptap/core'
import { RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { TableOfContentsPlugin } from './plugins'
import { buildTableOfContents } from './utils'

const DEFAULT_ANCHOR_TYPES = ['heading', RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME]

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      /**
       * @description Set search term in extension.
       */
      toggleOutline: (value: boolean) => ReturnType
    }
  }
}
const TableOfContents = Extension.create({
  name: 'tableOfContents',

  addStorage() {
    return {
      content: [],
      anchors: [],
      showOutline: this.options.showOutline,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.anchorTypes || DEFAULT_ANCHOR_TYPES,
        attributes: {
          id: {
            default: null,
            renderHTML: attrs => ({ id: attrs.id }),
            parseHTML: element => element.id || null,
          },
          'data-toc-id': {
            default: null,
            renderHTML: attrs => ({ 'data-toc-id': attrs['data-toc-id'] || attrs._id }),
            parseHTML: element => element.dataset.tocId || element.getAttribute('data-id') || null,
          },
        },
      },
    ]
  },

  addOptions() {
    return {
      onUpdate: () => {},
      getId: () => uuidv4(),
      showOutline: false,
      anchorTypes: DEFAULT_ANCHOR_TYPES,
    }
  },

  onUpdate() {
    buildTableOfContents(this)
  },

  onCreate() {
    const tr = this.editor.state.tr
    const seenIds = new Set()

    this.editor.state.doc.descendants((node, pos) => {
      if (this.options.anchorTypes.includes(node.type.name)) {
        const nodeId = node.attrs['data-toc-id']
        if (!nodeId || seenIds.has(nodeId)) {
          const newId = node.attrs._id || this.options.getId(node.textContent)
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, 'data-toc-id': newId, id: newId, _id: newId })
        }
        seenIds.add(nodeId)
      }
    })

    this.editor.view.dispatch(tr)
    buildTableOfContents(this)
  },
  addCommands() {
    return {
      toggleOutline:
        (showOutline: boolean) =>
        ({ editor }) => {
          editor.storage[this.name].showOutline = showOutline
          editor.view.dispatch(editor.state.tr.setMeta('toc', showOutline))
          return false
        },
    }
  },
  addProseMirrorPlugins() {
    return [TableOfContentsPlugin({ getId: this.options.getId, anchorTypes: this.options.anchorTypes })]
  },
})

export { TableOfContents, TableOfContentsPlugin }
