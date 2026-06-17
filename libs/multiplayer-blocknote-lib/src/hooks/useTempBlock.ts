import { Editor, useEditorState } from '@tiptap/react'

export function useTempBlock(node, editor: Editor) {
  const isTemp = useEditorState({
    editor,
    selector: ctx => ctx.editor.storage.aiAssistant.tempBlocks[node.attrs._id],
    equalityFn: (a, b) => a === b,
  })
  return isTemp
}
export function useTempBlockStyle(node, editor: Editor) {
  const isTemp = useTempBlock(node, editor)
  return isTemp ? 'ai-assistant-temp-block' : '' //'border-1 border-[#473CFB] shadow-[0_0_0_3px_#473cfb52]' : ''
}
