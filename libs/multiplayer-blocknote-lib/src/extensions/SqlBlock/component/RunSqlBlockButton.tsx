import { useCallback, useRef } from 'react'
import { NodeViewProps } from '@tiptap/react'

import RunBlockButton from 'src/components/RunBlockButton'
import { SqlBlockAttributes } from '../types'
import { useSqlBlock } from './SqlBlockContext'

type RunSqlBlockButtonProps = Pick<NodeViewProps, 'node' | 'editor'>

const RunSqlBlockButton = ({ node, editor }: RunSqlBlockButtonProps) => {
  const { blockState } = useSqlBlock()
  const abortCtrl = useRef<AbortController>()

  const handleRunBlock = useCallback(() => {
    if (blockState.running) return
    abortCtrl.current = new AbortController()
    editor.commands.runSqlBlock(node.attrs as SqlBlockAttributes, { signal: abortCtrl.current.signal })
  }, [blockState.running, editor, node.attrs])

  return (
    <RunBlockButton
      hasDebugger={false}
      running={blockState.running}
      abortController={abortCtrl.current}
      onRun={handleRunBlock}
    />
  )
}

export default RunSqlBlockButton
