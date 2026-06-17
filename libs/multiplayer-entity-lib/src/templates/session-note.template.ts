import { SessionNoteData } from '@multiplayer/types'

export const empty = (): SessionNoteData => ({
  type: 'doc',
  content: [],
})