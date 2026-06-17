import { Node } from '@tiptap/pm/model'
import { BlockState } from 'src/plugins'

export interface RunnableCodeBlockAttributes {
  _id: string
  _runnable: boolean
  _globalName: string

  content: string
  language: string
}

export interface RunnableCodeBlockState extends BlockState {
  error?: any
  result?: any
}

export interface RunnableCodeBlockNode extends Node {
  attrs: RunnableCodeBlockAttributes
}
