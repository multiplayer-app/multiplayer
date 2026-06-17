import { all, createLowlight } from 'lowlight'
import { CodeBlockOptions } from '@tiptap/extension-code-block'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

// import css from 'highlight.js/lib/languages/css'
// import js from 'highlight.js/lib/languages/javascript'
// import ts from 'highlight.js/lib/languages/typescript'
// import html from 'highlight.js/lib/languages/xml'

const lowlight = createLowlight(all)

// This is only an example, all supported languages are already loaded above
// but you can also register only specific languages to reduce bundle-size
// import json from 'highlight.js/lib/languages/json'
// lowlight.register('json', json)

const CodeBlockCustom = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive('codeBlock')) {
          editor.chain().insertContent('\t').focus().run()
          return true
        }
        return false
      },
    }
  },
})

export const CodeBlock = {
  ...CodeBlockCustom,
  configure: (options?: Partial<CodeBlockOptions>) => CodeBlockCustom.configure({ lowlight, ...options }),
}
