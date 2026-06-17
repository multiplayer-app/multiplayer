import { Mark, getMarksBetween, mergeAttributes } from '@tiptap/react'
import { Plugin } from 'prosemirror-state'
import { BlockEditorUser } from 'src/types'

export interface CommentOptions {
  user: BlockEditorUser
  HTMLAttributes: Record<string, any>
}

export interface CommentInstance {
  _id: string | null
  userId: string
  color: string
}

export const getHTMLAttributes = (comment: CommentInstance) => {
  if (!comment) return {}
  return {
    'data-comment': comment._id,
    style: `background-color: ${comment.color}60`,
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: () => ReturnType
      toggleComment: () => ReturnType
      unsetComment: () => ReturnType
      unsetCommentById: (id: string) => void
      unsetCommentsByIds: (ids: string[]) => void
      updateCommentAttributes: (id: string, payload: Partial<CommentInstance>) => void
    }
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: 'comment',
  addOptions() {
    return {
      HTMLAttributes: {},
      user: { id: 'guest', name: 'Guest', color: 'orange' },
    }
  },

  addAttributes() {
    return {
      comment: {
        default: null,
        parseHTML: el => (el as HTMLSpanElement).getAttribute('data-comment'),
        renderHTML: attrs => getHTMLAttributes(attrs.comment),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment]',
        getAttrs: el => !!(el as HTMLSpanElement).getAttribute('data-comment')?.trim() && null,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setComment:
        () =>
        ({ commands }) => {
          return commands.setMark('comment', {
            comment: { _id: 'new', userId: this.options.user.id, color: this.options.user.color },
          })
        },
      toggleComment:
        () =>
        ({ commands }) =>
          commands.toggleMark('comment'),
      unsetComment:
        () =>
        ({ commands }) => {
          commands.extendMarkRange('comment')
          return commands.unsetMark('comment') //, { extendEmptyMarkRange: true }
        },
      unsetCommentById:
        (id: string) =>
        ({ state, tr, dispatch }) => {
          getMarksBetween(0, state.doc.content.size - 1, state.doc).forEach(({ mark, from, to }) => {
            if (mark.type.name === 'comment' && mark.attrs.comment?._id === id) {
              dispatch(tr.removeMark(from, to, mark))
            }
          })
        },
      unsetCommentsByIds:
        (ids: string[]) =>
        ({ state, tr, dispatch }) => {
          getMarksBetween(0, state.doc.content.size - 1, state.doc).forEach(({ mark, from, to }) => {
            if (mark.type.name === 'comment' && !ids.includes(mark.attrs.comment._id)) {
              dispatch(tr.removeMark(from, to, mark))
            }
          })
        },
      updateCommentAttributes:
        (_: string, payload: Partial<CommentInstance>) =>
        ({ commands }) => {
          commands.updateAttributes('comment', { comment: payload })
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {},
      }),
    ]
  },
})
