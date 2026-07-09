import type { editor } from 'monaco-editor'

/** High-contrast One Dark palette for notebook code blocks. */
export const NOTEBOOK_DARK_MONACO_THEME: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'e4e4e7', background: '18181b' },
    { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'keyword.sql', foreground: 'c084fc' },
    { token: 'operator.sql', foreground: 'c084fc' },
    { token: 'predefined.sql', foreground: 'c084fc' },
    { token: 'string', foreground: '86efac' },
    { token: 'string.sql', foreground: '86efac' },
    { token: 'number', foreground: 'fcd34d' },
    { token: 'type', foreground: '67e8f9' },
    { token: 'type.identifier', foreground: '67e8f9' },
    { token: 'variable', foreground: 'fda4af' },
    { token: 'variable.name', foreground: 'fda4af' },
    { token: 'identifier', foreground: 'e4e4e7' },
    { token: 'function', foreground: '7dd3fc' },
    { token: 'support.function', foreground: '7dd3fc' },
    { token: 'delimiter', foreground: 'd4d4d8' },
    { token: 'tag', foreground: 'fda4af' },
    { token: 'attribute.name', foreground: 'fcd34d' },
    { token: 'attribute.value', foreground: '86efac' },
  ],
  colors: {
    'editor.background': '#18181b',
    'editor.foreground': '#e4e4e7',
    'editorLineNumber.foreground': '#52525b',
    'editorLineNumber.activeForeground': '#d4d4d8',
    'editorCursor.foreground': '#a78bfa',
    'editor.selectionBackground': '#3f3f46',
    'editor.inactiveSelectionBackground': '#27272a',
    'editor.lineHighlightBackground': '#27272a',
    'editor.lineHighlightBorder': '#00000000',
    'editorIndentGuide.background': '#3f3f46',
    'editorIndentGuide.activeBackground': '#52525b',
    'scrollbar.shadow': '#18181b',
    'scrollbarSlider.background': '#52525b80',
    'scrollbarSlider.hoverBackground': '#71717a80',
    'scrollbarSlider.activeBackground': '#a1a1aa80',
  },
}

export const NOTEBOOK_DARK_MONACO_THEME_ID = 'notebook-one-dark'

export function registerNotebookMonacoThemes(monaco: { editor: typeof import('monaco-editor').editor }) {
  monaco.editor.defineTheme(NOTEBOOK_DARK_MONACO_THEME_ID, NOTEBOOK_DARK_MONACO_THEME)
}
