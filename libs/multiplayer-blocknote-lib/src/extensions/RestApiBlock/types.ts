import { Node } from '@tiptap/pm/model'
import { BlockState } from 'src/plugins'
import { Notebook } from '@multiplayer/types'

export interface RestApiNode extends Node {
  attrs: Notebook.RestApiBlockAttributes
}

export interface ApiBlockState extends BlockState {
  error?: any
  result?: any
}
