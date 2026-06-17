import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Fragment, Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { EditorView } from '@tiptap/pm/view'
import { CUSTOM_BLOCKS } from 'src/lib/constants'
import { generateId } from 'src/lib/utils'

export const copyPastePlugin = (blockType, pluginKey, attrParser) =>
  new Plugin({
    key: new PluginKey(pluginKey),
    props: {
      handlePaste: (view, event) => {
        if (!event.clipboardData) return false

        const text = event.clipboardData.getData('text/plain')
        if (!text) return false

        try {
          const pastedData = JSON.parse(text)

          if (pastedData.type && CUSTOM_BLOCKS.has(pastedData.type)) {
            const { state, dispatch } = view
            const { tr } = state

            const parsedAttrs = attrParser(pastedData, state)
            parsedAttrs._id = generateId()

            const node = state.schema.nodes[pastedData.type].create(
              parsedAttrs,
              pastedData.content ? Fragment.fromJSON(state.schema, pastedData.content) : undefined,
            )

            tr.replaceSelectionWith(node)
            dispatch(tr)
            return true
          }
        } catch (e) {
          return false
        }

        return false
      },
      // transformCopied: (slice: Slice) => {
      //   const addCopyPasteDataToNodes = (node: ProseMirrorNode) => {
      //     if (node.type === schema.nodes[RUNNABLE_API_BLOCK_NAME]) {
      //       return node.type.create({ ...node.attrs }, node.content)
      //     }
      //     return node.copy(node.content)
      //   }
      //   return mapSlice(slice, addCopyPasteDataToNodes)
      // },
      transformPasted: (slice: Slice, view: EditorView) => {
        const fetchAndClearCopyPasteData = (node: ProseMirrorNode) => {
          if (node.type === blockType) {
            const attrs = attrParser(node, view.state)
            attrs._id = generateId()
            return node.type.create(attrs, node.content)
          }
          return node.copy(node.content)
        }
        return mapSlice(slice, fetchAndClearCopyPasteData)
      },
    },
  })

const mapFragment = (
  fragment: Fragment,
  callback: (node: ProseMirrorNode) => ProseMirrorNode | ProseMirrorNode[] | Fragment | null,
): Fragment =>
  Fragment.fromArray(
    (fragment as any).content.map((node: ProseMirrorNode) => {
      if (node.content.childCount > 0) {
        return node.type.create(node.attrs, mapFragment(node.content, callback))
      }

      return callback(node)
    }),
  )

const mapSlice = (
  slice: Slice,
  callback: (node: ProseMirrorNode) => ProseMirrorNode | ProseMirrorNode[] | Fragment | null,
): Slice => {
  const fragment = mapFragment(slice.content, callback)
  return new Slice(fragment, slice.openStart, slice.openEnd)
}
