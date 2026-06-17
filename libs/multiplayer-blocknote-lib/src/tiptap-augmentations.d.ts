export {}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bold: { toggleBold: () => ReturnType }
    italic: { toggleItalic: () => ReturnType }
    strike: { toggleStrike: () => ReturnType }
    code: { toggleCode: () => ReturnType }
  }
}
