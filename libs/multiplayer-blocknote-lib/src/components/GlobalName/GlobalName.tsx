import { Editor } from '@tiptap/core'
import { useEffect, useRef, useState } from 'react'
import { findGlobalVariableRanges } from 'src/extensions/RunnableCodeBlock/utils'
import { cn, getExistingNames, getRunnableBlocks } from 'src/lib/utils'
import { CHART_BLOCK_NAME, RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { replaceAttrVariable } from 'src/extensions/RestApiBlock/utils'

interface GlobalNameProps {
  node: any
  name: string
  editor: Editor
  onChange: (name: string) => void
}

const GlobalName = ({ editor, node, name, onChange }: GlobalNameProps) => {
  const [localName, setLocalName] = useState(name)
  const [errorMessage, setErrorMessage] = useState('')
  const [inputWidth, setInputWidth] = useState(0)
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setLocalName(name)
  }, [name])

  useEffect(() => {
    updateInputWidth()
  }, [localName])

  const updateInputWidth = () => {
    requestAnimationFrame(() => {
      if (spanRef.current) {
        const spanWidth = spanRef.current.offsetWidth
        setInputWidth(spanWidth)
      }
    })
  }

  const validateName = (value: string): string => {
    if (!value) {
      return 'Block name cannot be empty.'
    }
    if (!/^[a-zA-Z_$]/.test(value)) {
      return 'Block name must start with a letter, underscore (_), or dollar sign ($).'
    }
    if (!isValidJsVariableName(value)) {
      return 'Block name contains invalid characters or is a reserved JavaScript keyword.'
    }
    if (getExistingNames({ editorState: editor.state, node }).has(value)) {
      return 'Block name is already in use.'
    }
    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const newVal = value.trim().replace(/[^a-zA-Z0-9_$]/g, '')
    setLocalName(newVal)
    setErrorMessage(validateName(newVal))
  }

  const handleBlur = () => {
    const error = validateName(localName)
    if (!error && localName !== name) {
      onChange(localName)
      updateGlobalVariableName(editor, name, localName)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        ref={spanRef}
        className="invisible border h-0 absolute px-1 py-0.5 text-sm font-medium"
        style={{ whiteSpace: 'pre' }}
      >
        {localName || name || ' '}
      </span>
      <input
        className={cn(
          'border px-1 rounded-lg py-0.5 bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-200 text-sm font-medium',
          !errorMessage ? 'border-gray-300 dark:border-neutral-700' : 'border-red-500',
        )}
        value={localName}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={!editor.isEditable}
        style={{ width: `${inputWidth}px` }}
      />
      {errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
    </div>
  )
}

const updateGlobalVariableName = (editor: Editor, oldName: string, newName: string) => {
  const chartBlocks = getRunnableBlocks(editor.state, CHART_BLOCK_NAME, false)
  const runnableApiBlocks = getRunnableBlocks(editor.state, RUNNABLE_API_BLOCK_NAME)
  const runnableCodeBlocks = getRunnableBlocks(editor.state, RUNNABLE_CODE_BLOCK_NAME)

  const resolver = replaceAttrVariable(oldName, newName)

  runnableApiBlocks.forEach(node => {
    const attrsStr = JSON.stringify(node.attrs)
    if (attrsStr.includes(oldName) || attrsStr.includes(newName)) {
      try {
        const attrs = JSON.parse(resolver(attrsStr))
        editor.commands.updateRestApiBlockAttributes(node.attrs._id, attrs)
      } catch (error) {
        console.warn('Unable to replace variable!')
      }
    }
  })

  const oldHandlerName = `$${oldName}`
  const newHandlerName = `$${newName}`

  runnableCodeBlocks.forEach(node => {
    const oldContent = node.attrs.content
    const updatedContent = getUpdatedContent(oldContent, oldName, newName, oldHandlerName, newHandlerName)
    const content = updatedContent.join('\n')
    if (content !== oldContent) {
      editor.commands.updateRunnableCodeBlockAttributes(node.attrs._id, { content })
    }
  })

  chartBlocks.forEach(node => {
    const oldContent = node.attrs.javascript
    const updatedContent = getUpdatedContent(oldContent, oldName, newName, oldHandlerName, newHandlerName)
    const content = updatedContent.join('\n')
    if (content !== oldContent) {
      editor.commands.updateChartBlockAttributes(node.attrs._id, { javascript: content })
    }
  })
}

const getUpdatedContent = (
  content: string,
  oldName: string,
  newName: string,
  oldHandlerName: string,
  newHandlerName: string,
) => {
  const ranges = findGlobalVariableRanges(
    content,
    { [oldName]: null, [newName]: null },
    { [oldHandlerName]: null, [newHandlerName]: null },
  )
  const oldContent = content.split('\n')
  const rangeMap = new Map<number, Array<{ startColumn: number; endColumn: number; replacement: string }>>()

  Object.entries(ranges)
    .flatMap(([key, variableRanges]) =>
      variableRanges.map(({ startLineNumber, startColumn, endColumn }) => ({
        startLineNumber,
        startColumn,
        endColumn,
        replacement: key === oldName ? newName : newHandlerName,
      })),
    )
    .forEach(({ startLineNumber, startColumn, endColumn, replacement }) => {
      if (!rangeMap.has(startLineNumber)) {
        rangeMap.set(startLineNumber, [])
      }
      rangeMap.get(startLineNumber)!.push({ startColumn, endColumn, replacement })
    })

  if (rangeMap.size === 0) return oldContent

  return oldContent.map((line, index) => {
    const lineNumber = index + 1
    if (!rangeMap.has(lineNumber)) return line

    let updatedLine = line
    const replacements = rangeMap.get(lineNumber)!.sort((a, b) => b.startColumn - a.startColumn)

    replacements.forEach(({ startColumn, endColumn, replacement }) => {
      updatedLine = updatedLine.slice(0, startColumn - 1) + replacement + updatedLine.slice(endColumn - 1)
    })

    return updatedLine
  })
}

const isValidJsVariableName = (input: string): boolean => {
  return !isReservedKeyword(input)
}

const isReservedKeyword = (input: string): boolean => {
  const reservedKeywords = new Set([
    'abstract',
    'await',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'double',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'final',
    'finally',
    'float',
    'for',
    'function',
    'goto',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'int',
    'interface',
    'let',
    'long',
    'native',
    'new',
    'null',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'volatile',
    'while',
    'with',
    'yield',
  ])
  return reservedKeywords.has(input)
}

export default GlobalName
