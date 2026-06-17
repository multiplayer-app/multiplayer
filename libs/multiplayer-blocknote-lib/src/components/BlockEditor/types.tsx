import { Editor } from '@tiptap/react'
import React, { PropsWithChildren } from 'react'

export interface TiptapProps extends PropsWithChildren {
  editor: Editor
  children?: React.ReactNode | undefined
  // Add the new option for custom block exclusions
  customBlockExclusions?: string[]
  // Optional theme propagated from host app (e.g. Chakra color mode)
  theme?: 'light' | 'dark'
}

export type EditorUser = {
  clientId: string
  name: string
  color: string
  initials?: string
}

export interface BlockEditorRef {
  scrollContainer: HTMLDivElement | null
  scrollTo: (options: ScrollToOptions) => void
  getScrollPosition: () => { scrollTop: number; scrollHeight: number; clientHeight: number }
  addScrollListener: (listener: (event: Event) => void) => void
  removeScrollListener: (listener: (event: Event) => void) => void
}
