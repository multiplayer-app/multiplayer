import { useState, memo } from 'react'
import { useRestApiBlock } from '../RestApiBlockContext'
import { formatDuration } from '../../utils'
import { cn } from 'src/lib/utils'
import TimeAgo from 'src/components/TimeAgo'
import Tooltip from 'src/components/ui/Tooltip'
import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'
import CodeView from 'src/components/CodeView'

const tabs = [
  { key: 'response', label: 'Response' },
  { key: 'headers', label: 'Headers' },
]

const RestApiBlockResult = memo(() => {
  const [tab, setTab] = useState('response')
  const [collapsed, setCollapse] = useState(false)
  const { blockState, removeBlockState } = useRestApiBlock()
  const { result, error, updatedAt, createdAt } = blockState

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden font-medium">
        <pre className="code-result-pre text-xs p-4 text-red-500">
          <code className="code-result-code text-xs">{error.message || 'Something went wrong!'}</code>
        </pre>
      </div>
    )
  }

  if (!result) return null
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden font-medium">
      <div className="flex items-center border-b border-gray-200 dark:border-neutral-800 text-sm pr-2">
        {tabs.map(t => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(`px-4 py-2 relative focus:outline-none`, isActive ? 'text-[#473CFB]' : '')}
            >
              {t.label}
              {isActive && <span className="h-[3px] rounded-t absolute bottom-0 left-4 right-4 bg-[#473CFB]"></span>}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <Toolbar.Button tooltip="Remove result" onClick={removeBlockState}>
            <Icon name="Trash2" className="text-gray-500 inline" />
          </Toolbar.Button>
          <Toolbar.Button tooltip={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapse(prev => !prev)}>
            <Icon name={collapsed ? 'ChevronsUpDown' : 'ChevronsDownUp'} className="text-gray-500 inline" />
          </Toolbar.Button>
        </div>
      </div>

      {/* Status and Meta Information */}
      <div
        className={cn(
          'flex items-center gap-4 px-4 p-2 text-sm text-gray-600 dark:text-neutral-200 border-b border-gray-200 dark:border-neutral-800',
          !collapsed ? 'border-b' : '',
        )}
      >
        <span
          className={cn(
            "font-['JetBrains_Mono']",
            result.status >= 200 && result.status < 400 ? 'text-green-700' : 'text-red-700',
          )}
        >
          {result.status} {result.statusText}
        </span>
        <span>{result.size}</span>
        <span>{formatDuration(result.duration)}</span>
        <Tooltip
          className="ml-auto"
          title={
            <span>
              Created at: {new Date(createdAt).toLocaleString()}
              <br />
              Updated at: {new Date(updatedAt).toLocaleString()}
            </span>
          }
        >
          <TimeAgo date={updatedAt} />
        </Tooltip>
      </div>

      {collapsed ? null : tab === 'response' ? (
        <CodeView value={result.data} language="json" />
      ) : (
        <Headers headers={result.headers} />
      )}
    </div>
  )
})
const Headers = ({ headers = {} }) => {
  return (
    <div className="max-h-56 overflow-auto">
      <table className="w-full table-fixed table-no-border">
        <tbody>
          {Object.keys(headers).map(key => (
            <tr key={key}>
              <td>{key}</td>
              <td>{headers[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RestApiBlockResult
