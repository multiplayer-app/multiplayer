import React, { useMemo } from 'react'
import CodeView from 'src/components/CodeView'
import { useRunnableCodeBlock } from '../RunnableCodeBlockContext'
import { Icon } from 'src/components/ui/Icon'

const CodeBlockResult: React.FC = () => {
  const { blockState } = useRunnableCodeBlock()

  if (!blockState || (!('result' in blockState) && !('error' in blockState))) {
    return null
  }

  const { result, error, running } = blockState

  const renderStatus = useMemo(() => {
    if (running) {
      return (
        <span className="flex items-center gap-1">
          <Icon name="FastForward" className="text-blue-500" /> Running
        </span>
      )
    }

    if (error) {
      return (
        <span className="flex items-center gap-1">
          <Icon name="Info" className="text-red-500" /> Error
        </span>
      )
    }

    return (
      <span className="flex items-center gap-1">
        <Icon name="CircleCheck" className="text-green-500" /> Result
      </span>
    )
  }, [running, error])

  const renderContent = useMemo(() => {
    if (error) {
      return (
        <pre className="code-result-pre text-xs p-4 text-red-500 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md">
          <code className="code-result-code text-xs user-select-text">
            {typeof error === 'string' ? error : JSON.stringify(error, null, 4)}
          </code>
        </pre>
      )
    }

    if (result) {
      return <CodeView value={JSON.stringify(result, null, 4)} language="javascript" minHeight={40} />
    }

    return (
      <pre className="code-result-pre text-xs p-4 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md">
        <code className="code-result-code text-xs">{String(result)}</code>
      </pre>
    )
  }, [result, error])

  return (
    <div className="relative pt-2">
      <div className="flex gap-2 absolute top-[-13px] left-4 p-1 pr-2 rounded-full bg-gray-100 dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-100 shadow-sm border border-gray-200 dark:border-neutral-800">
        {renderStatus}
      </div>

      {renderContent}
    </div>
  )
}

export default CodeBlockResult
