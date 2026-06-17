import { ReactNodeViewRenderer } from '@tiptap/react'
import { mergeAttributes, Range } from '@tiptap/core'

import { ImageBlockView } from './components/ImageBlockView'
import { Image } from '../Image'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string }) => ReturnType
      setImageBlockAt: (attributes: { src: string; pos: number | Range }) => ReturnType
      setImageBlockAlign: (align: 'left' | 'center' | 'right') => ReturnType
      setImageBlockWidth: (width: number) => ReturnType
    }
  }
}

export const ImageBlock = Image.extend({
  name: 'imageBlock',

  group: 'block',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element: { getAttribute: (arg0: string) => any }) => element.getAttribute('src'),
        renderHTML: (attributes: { src: any }) => ({
          src: attributes.src,
        }),
      },
      width: {
        default: '100%',
        parseHTML: (element: { getAttribute: (arg0: string) => any }) => element.getAttribute('data-width'),
        renderHTML: (attributes: { width: any }) => ({
          'data-width': attributes.width,
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element: { getAttribute: (arg0: string) => any }) => element.getAttribute('data-align'),
        renderHTML: (attributes: { align: any }) => ({
          'data-align': attributes.align,
        }),
      },
      alt: {
        default: undefined,
        parseHTML: (element: { getAttribute: (arg0: string) => any }) => element.getAttribute('alt'),
        renderHTML: (attributes: { alt: any }) => ({
          alt: attributes.alt,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src*="tiptap.dev"]:not([src^="data:"]), img[src*="windows.net"]:not([src^="data:"])',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
      setImageBlock:
        (attrs: { src: any }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'imageBlock',
            attrs: { src: attrs.src },
          })
        },

      setImageBlockAt:
        (attrs: { pos: any; src: any }) =>
        ({ commands }) => {
          return commands.insertContentAt(attrs.pos, {
            type: 'imageBlock',
            attrs: { src: attrs.src },
          })
        },

      setImageBlockAlign:
        (align: any) =>
        ({ commands }) =>
          commands.updateAttributes('imageBlock', { align }),

      setImageBlockWidth:
        (width: number) =>
        ({ commands }) =>
          commands.updateAttributes('imageBlock', {
            width: `${Math.max(0, Math.min(100, width))}%`,
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView)
  },
})

export default ImageBlock
