import { Editor } from '@tiptap/core'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomElement(array: Array<unknown>) {
  return array[Math.floor(Math.random() * array.length)]
}

export function getExtensionOptions(editor, name) {
  const extension = editor.extensionManager.extensions.find(extension => extension.name === name)

  return extension?.options || {}
}

export function getExtensionStorage(editor: Editor, name: string) {
  const extension = editor.extensionManager.extensions.find(ext => ext.name === name)
  return extension && extension.storage
}

export function moveCursorToEnd(editor: Editor) {
  editor.chain().setTextSelection(editor.state.doc.content.size).run()
}

export * from './cssVar'
export * from './getRenderContainer'
export * from './isCustomNodeSelected'
export * from './isTextSelected'
export * from './runnableBlocks'
