import root from 'react-shadow'

import { Notebook } from '@multiplayer/types'
import { syntaxTree } from '@codemirror/language'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { history, historyKeymap } from '@codemirror/commands'
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { autocompletion, CompletionContext } from '@codemirror/autocomplete'
import { keymap, tooltips, placeholder as placeholderExt, EditorView } from '@codemirror/view'

import { useRestApiBlock } from '../RestApiBlockContext'
import { ReactiveEnvPlugin } from './variableHighlightPlugin'
import { cn, getVariableParsedValue } from 'src/lib/utils'
import { shadowStyles } from './shadowStyles'
import { useTheme } from 'src/providers/ThemeProvider'

interface AutoCompleteProps {
  value?: string
  styles?: string
  className?: string
  placeholder?: string
  readOnly?: boolean
  autoFocus?: boolean
  multiline?: boolean
  onChange?: (data: string) => void
}

const AutoComplete = ({
  value = '',
  className = '',
  readOnly = false,
  autoFocus = false,
  placeholder = '',
  multiline = false,
  onChange,
}: AutoCompleteProps) => {
  const { variables } = useRestApiBlock()
  const { theme } = useTheme()
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const pluginRef = useRef<ReactiveEnvPlugin | null>(null)
  const autoCompleteWrapperRef = useRef<HTMLDivElement>(null)

  const getEnvHighlightExtension = useCallback(() => {
    if (pluginRef.current) {
      return pluginRef.current
    }
    return (pluginRef.current = new ReactiveEnvPlugin(variables))
  }, [variables])

  const attachEnvironmentHighlightPlugin = useCallback(
    (view: EditorView) => {
      if (pluginRef.current) {
        pluginRef.current.handleEnvChange(view, variables)
      }
    },
    [variables],
  )

  useEffect(() => {
    if (pluginRef.current && editorRef.current?.view) {
      pluginRef.current.handleEnvChange(editorRef.current.view, variables)
    }
  }, [variables])

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        autoCompleteWrapperRef.current?.scrollIntoView()
      })
    }
  }, [autoFocus])

  const extensions = useMemo(() => {
    const exts = [
      history(),
      tooltips(),
      placeholderExt(placeholder),
      keymap.of([...historyKeymap]),
      getEnvHighlightExtension(),
      autocompletion({
        activateOnTyping: true,
        override: [createAutocompleteExtension(variables)],
      }),
    ] as any[]

    if (multiline) {
      exts.push(EditorView.lineWrapping)
    }

    return exts
  }, [variables, placeholder, multiline, getEnvHighlightExtension])

  return (
    <div ref={autoCompleteWrapperRef} className={cn('autocomplete-wrapper relative h-9', className)}>
      <root.div className="no-scrollbar absolute inset-0 flex items-center divide-x divide-dividerLight overflow-x-auto">
        <CodeMirror
          value={value}
          theme={theme}
          height="inherit"
          ref={editorRef}
          readOnly={readOnly}
          basicSetup={false}
          onChange={onChange}
          extensions={extensions}
          autoFocus={autoFocus && !readOnly}
          onCreateEditor={attachEnvironmentHighlightPlugin}
        />
        <style type="text/css">{shadowStyles}</style>
      </root.div>
    </div>
  )
}

const createAutocompleteExtension = (variables: Notebook.AggregateVariable[]) => {
  return (context: CompletionContext) => {
    const options = variables.map(variable => ({
      info: getVariableParsedValue(variable.value),
      label: `{{${variable.key}}}`,
      apply: `{{${variable.key}}}`,
    }))

    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)
    const textBefore = context.state.sliceDoc(nodeBefore.from, context.pos)
    const match = /{{\$?\w*$/.exec(textBefore)

    if (!match) return null

    return {
      from: nodeBefore.from + (match.index || 0),
      options,
      validFor: /^({{\$?\w*)?$/,
    }
  }
}

export default AutoComplete
