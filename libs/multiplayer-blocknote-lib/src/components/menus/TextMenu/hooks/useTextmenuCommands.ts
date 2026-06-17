import { Editor } from '@tiptap/react'
import { useCallback } from 'react'
export const useTextmenuCommands = (editor: Editor) => {
  const onBold = useCallback(() => editor.chain().focus().toggleBold().run(), [editor])
  const onItalic = useCallback(() => editor.chain().focus().toggleItalic().run(), [editor])
  const onStrike = useCallback(() => editor.chain().focus().toggleStrike().run(), [editor])
  const onUnderline = useCallback(() => editor.chain().focus().toggleUnderline().run(), [editor])
  const onCode = useCallback(() => editor.chain().focus().toggleCode().run(), [editor])
  const onCodeBlock = useCallback(() => editor.chain().focus().toggleCodeBlock().run(), [editor])
  const onComment = useCallback(() => editor.chain().focus().setComment().run(), [editor])
  const onApiBlock = useCallback(() => editor.chain().focus().setRestApiBlock().run(), [editor])

  const onSubscript = useCallback(() => editor.chain().focus().toggleSubscript().run(), [editor])
  const onSuperscript = useCallback(() => editor.chain().focus().toggleSuperscript().run(), [editor])
  const onAlignLeft = useCallback(() => editor.chain().focus().setTextAlign('left').run(), [editor])
  const onAlignCenter = useCallback(() => editor.chain().focus().setTextAlign('center').run(), [editor])
  const onAlignRight = useCallback(() => editor.chain().focus().setTextAlign('right').run(), [editor])
  const onAlignJustify = useCallback(() => editor.chain().focus().setTextAlign('justify').run(), [editor])

  const onChangeColor = useCallback((color: string) => editor.chain().setColor(color).run(), [editor])
  const onClearColor = useCallback(() => editor.chain().focus().unsetColor().run(), [editor])

  const onChangeHighlight = useCallback((color: string) => editor.chain().setHighlight({ color }).run(), [editor])
  const onClearHighlight = useCallback(() => editor.chain().focus().unsetHighlight().run(), [editor])

  const onLink = useCallback(
    (url: string, inNewTab?: boolean) =>
      editor
        .chain()
        .focus()
        .setLink({ href: url, target: inNewTab ? '_blank' : '' })
        .run(),
    [editor],
  )

  const onSetFontSize = useCallback(
    (fontSize: string) => {
      if (!fontSize || fontSize.length === 0) {
        return editor.chain().focus().unsetFontSize().run()
      }
      return editor.chain().focus().setFontSize(fontSize).run()
    },
    [editor],
  )

  return {
    onBold,
    onLink,
    onCode,
    onItalic,
    onStrike,
    onComment,
    onApiBlock,
    onUnderline,
    onCodeBlock,
    onSubscript,
    onAlignLeft,
    onAlignRight,
    onClearColor,
    onAlignCenter,
    onSuperscript,
    onSetFontSize,
    onChangeColor,
    onAlignJustify,
    onClearHighlight,
    onChangeHighlight,
  }
}
