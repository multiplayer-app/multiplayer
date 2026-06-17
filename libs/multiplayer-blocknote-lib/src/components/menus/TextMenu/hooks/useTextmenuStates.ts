import { useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { ShouldShowProps } from '../../types'
import { isCustomNodeSelected, isTextSelected } from '../../../../lib/utils'

export const useTextmenuStates = (editor: Editor, customBlockExclusions: string[]) => {
  const shouldShow = useCallback(
    ({ view, from }: ShouldShowProps) => {
      if (!view) {
        return false
      }

      const domAtPos = view.domAtPos(from || 0).node as HTMLElement
      const nodeDOM = view.nodeDOM(from || 0) as HTMLElement
      const node = nodeDOM || domAtPos

      if (isCustomNodeSelected(editor, node, customBlockExclusions)) {
        return false
      }
      if (editor.storage.searchAndReplace.searchTerm.trim()) {
        return false
      }
      return isTextSelected({ editor })
    },
    [editor, customBlockExclusions],
  )

  const checkColor = (color: string) => {
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      return color
    }
    return null
  }

  return {
    isBold: editor.isActive('bold'),
    isItalic: editor.isActive('italic'),
    isStrike: editor.isActive('strike'),
    isUnderline: editor.isActive('underline'),
    isCode: editor.isActive('code'),
    isComment: editor.isActive('comment'),
    isSubscript: editor.isActive('subscript'),
    isSuperscript: editor.isActive('superscript'),
    isAlignLeft: editor.isActive({ textAlign: 'left' }),
    isAlignCenter: editor.isActive({ textAlign: 'center' }),
    isAlignRight: editor.isActive({ textAlign: 'right' }),
    isAlignJustify: editor.isActive({ textAlign: 'justify' }),
    currentColor: checkColor(editor.getAttributes('textStyle')?.color) || '#394150',
    currentHighlight: checkColor(editor.getAttributes('highlight')?.color) || '#ffffff',
    currentFont: editor.getAttributes('textStyle')?.fontFamily || undefined,
    currentSize: editor.getAttributes('textStyle')?.fontSize || undefined,
    shouldShow,
  }
}
