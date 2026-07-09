import { useMemo } from 'react'

import { Icon } from 'src/components/ui/Icon'
import { cn } from 'src/lib/utils'
import { useSqlBlock } from './SqlBlockContext'

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const SqlBlockResult = () => {
  const { blockState, removeBlockState } = useSqlBlock()
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
        <Icon name="CircleCheck" className="text-green-500" /> Results
      </span>
    )
  }, [running, error])

  if (!running && !error && !result) {
    return null
  }

  return (
    <div className="relative pt-2 px-2 pb-2">
      <div className="flex gap-2 absolute top-[-13px] left-4 p-1 pr-2 rounded-full bg-gray-100 dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-100 shadow-sm border border-gray-200 dark:border-neutral-800">
        {renderStatus}
        {result && !running && (
          <span className="text-neutral-500 dark:text-neutral-400">
            {result.rowCount} row{result.rowCount !== 1 ? 's' : ''}
            {result.durationMs != null && ` · ${result.durationMs}ms`}
          </span>
        )}
        {!running && (result || error) && (
          <button
            type="button"
            onClick={removeBlockState}
            className="ml-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            aria-label="Clear results"
          >
            <Icon name="X" className="w-3 h-3" />
          </button>
        )}
      </div>

      {error && (
        <pre className="code-result-pre text-xs p-4 text-red-500 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-md overflow-auto">
          <code className="code-result-code text-xs user-select-text">{error}</code>
        </pre>
      )}

      {result && !error && (
        <div className="overflow-auto max-h-80 border border-gray-200 dark:border-neutral-800 rounded-md bg-white dark:bg-neutral-900">
          {result.columns.length === 0 ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 p-4">Query executed successfully. No rows returned.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
                  {result.columns.map(column => (
                    <th
                      key={column}
                      className="px-3 py-2 text-left font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'border-b border-gray-100 dark:border-neutral-800 last:border-b-0',
                      rowIndex % 2 === 1 && 'bg-gray-50/50 dark:bg-neutral-950/50',
                    )}
                  >
                    {result.columns.map(column => (
                      <td
                        key={column}
                        className="px-3 py-2 text-neutral-800 dark:text-neutral-100 font-['JetBrains_Mono'] whitespace-nowrap max-w-xs truncate"
                        title={formatCellValue(row[column])}
                      >
                        {formatCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default SqlBlockResult
