import * as Y from 'yjs'
import { EditorOptions } from '@tiptap/react'
import { Notebook } from '@multiplayer/types'

export type IMultiplayerDebugger = Notebook.IMultiplayerDebugger

export type ISecretsManager = Notebook.ISecretsManager

export interface IDebugOptions {
  instance: IMultiplayerDebugger | null
  runWithDebugger: boolean
}

export interface BlockEditorUser {
  id: string
  name: string
  color: string
}

export interface BlocknoteCollaborationOptions {
  provider: any
  fragment: any
  undoManager: Y.UndoManager
}

export interface BlockEditorAiAssistantOptions {
  apiInstance?: any
  path: string
}

export interface BlockEditorProxyOptions {
  apiInstance?: any
  path: string
}

export interface BlockEditorOptions extends EditorOptions {
  user?: BlockEditorUser
  showOutline?: boolean
  allowComments?: boolean
  environments?: Y.Map<string>
  allowRunnableBlocks?: boolean

  proxy?: BlockEditorProxyOptions
  secretsManager?: ISecretsManager
  notebookDebugger?: IMultiplayerDebugger
  aiAssistant?: BlockEditorAiAssistantOptions
  collaboration?: BlocknoteCollaborationOptions
}
