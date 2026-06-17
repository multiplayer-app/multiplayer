import { useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Node } from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import { generateId, runnableBlocks, getNameCopy, clone } from 'src/lib/utils'
import { CUSTOM_BLOCKS } from 'src/lib/constants'

const useContentItemActions = (editor: Editor, currentNode: Node | null, currentNodePos: number) => {
  const resetTextFormatting = useCallback(() => {
    const chain = editor.chain()

    chain.setNodeSelection(currentNodePos).unsetAllMarks()
    chain.setTextSelection(0)

    if (currentNode?.type.name !== 'paragraph') {
      chain.setParagraph()
    }

    chain.run()
  }, [editor, currentNodePos, currentNode?.type.name])

  const duplicateNode = useCallback(() => {
    editor.commands.setNodeSelection(currentNodePos)

    const { $anchor } = editor.state.selection
    const selectedNode = $anchor.node(1) || (editor.state.selection as NodeSelection).node
    const nodeDuplicate = clone(selectedNode.toJSON())

    if (runnableBlocks.has(selectedNode.type.name)) {
      nodeDuplicate.attrs['_id'] = generateId()
      nodeDuplicate.attrs['_globalName'] = getNameCopy(selectedNode.attrs._globalName, editor.state)
    }

    editor
      .chain()
      .setMeta('hideDragHandle', true)
      .insertContentAt(currentNodePos + (currentNode?.nodeSize || 0), nodeDuplicate)
      .run()
  }, [editor, currentNodePos, currentNode?.nodeSize])

  const copyNodeToClipboard = useCallback(() => {
    editor.chain().setMeta('hideDragHandle', true).setNodeSelection(currentNodePos).run()

    const { $anchor } = editor.state.selection
    const selectedNode = $anchor.node(1) || (editor.state.selection as NodeSelection).node

    if (selectedNode && CUSTOM_BLOCKS.has(selectedNode.type.name)) {
      // Create a temporary textarea to copy JSON data
      const textarea = document.createElement('textarea')
      textarea.value = JSON.stringify(selectedNode.toJSON())
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    } else {
      // For regular text content, use the default copy behavior
      document.execCommand('copy')
    }

    editor.chain().setTextSelection(0).run()
  }, [editor, currentNodePos])

  const deleteNode = useCallback(() => {
    editor.chain().setMeta('hideDragHandle', true).setNodeSelection(currentNodePos).deleteSelection().run()
  }, [editor, currentNodePos])

  const handleAdd = useCallback(() => {
    if (currentNodePos !== -1) {
      const currentNodeSize = currentNode?.nodeSize || 0
      const insertPos = currentNodePos + currentNodeSize
      const currentNodeIsEmptyParagraph = currentNode?.type.name === 'paragraph' && currentNode?.content?.size === 0
      const focusPos = currentNodeIsEmptyParagraph ? currentNodePos + 2 : insertPos + 2

      editor
        .chain()
        .command(({ dispatch, tr, state }) => {
          if (dispatch) {
            if (currentNodeIsEmptyParagraph) {
              tr.insertText('/', currentNodePos, currentNodePos + 1)
            } else {
              tr.insert(insertPos, state.schema.nodes.paragraph.create(null, [state.schema.text('/')]))
            }

            return dispatch(tr)
          }

          return true
        })
        .focus(focusPos)
        .run()
    }
  }, [currentNode, currentNodePos, editor])

  return {
    resetTextFormatting,
    duplicateNode,
    copyNodeToClipboard,
    deleteNode,
    handleAdd,
  }
}

export default useContentItemActions
