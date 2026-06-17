import { Editor } from '@tiptap/react'

import {
  Link,
  CodeBlock,
  Figcaption,
  ImageUpload,
  ImageBlock,
  HorizontalRule,
  Comment,
  RestApiBlock,
  RunnableCodeBlock,
  ChartBlock,
} from '../../extensions'

export const isTableGripSelected = (node: HTMLElement) => {
  let container = node

  while (container && !['TD', 'TH'].includes(container.tagName)) {
    container = container.parentElement!
  }

  const gripColumn = container && container.querySelector && container.querySelector('a.grip-column.selected')
  const gripRow = container && container.querySelector && container.querySelector('a.grip-row.selected')

  if (gripColumn || gripRow) {
    return true
  }

  return false
}

// Default custom nodes that should exclude the text menu
const DEFAULT_CUSTOM_NODES = [
  Link.name,
  Comment.name,
  CodeBlock.name,
  Figcaption.name,
  ImageBlock.name,
  ImageBlock.name,
  ChartBlock.name,
  ImageUpload.name,
  RestApiBlock.name,
  HorizontalRule.name,
  RunnableCodeBlock.name,
]

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement, additionalCustomNodes: string[] = []) => {
  const customNodes = [...DEFAULT_CUSTOM_NODES, ...additionalCustomNodes]

  return customNodes.some(type => editor.isActive(type)) || isTableGripSelected(node)
}

export default isCustomNodeSelected
