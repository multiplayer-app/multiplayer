import { Plugin, PluginKey } from '@tiptap/pm/state'

export const TableOfContentsPlugin = ({ getId, anchorTypes }) =>
  new Plugin({
    key: new PluginKey('tableOfContent'),
    appendTransaction(previousTransactions, oldState, newState) {
      const tr = newState.tr
      let modified = false

      if (previousTransactions.some(tx => tx.docChanged)) {
        const seenIds = new Set()

        newState.doc.descendants((node, pos) => {
          const nodeId = node.attrs['data-toc-id']
          if (anchorTypes.includes(node.type.name)) {
            if (!nodeId || seenIds.has(nodeId)) {
              const newId = node.attrs._id || getId(node.textContent)
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, 'data-toc-id': newId, id: newId, _id: newId })
              modified = true
            }
            seenIds.add(nodeId)
          }
        })
      }

      return modified ? tr : null
    },
  })
