import RunBlockButton from 'src/components/RunBlockButton'
import { useRunnableCodeBlock } from '../RunnableCodeBlockContext'
import { useCallback, useRef } from 'react'

const RunCodeBlockButton = ({ node, editor, hasDebugger }) => {
  const { blockState } = useRunnableCodeBlock()
  const abortCtrl = useRef<AbortController>()

  const handleRunBlock = useCallback(
    (runWithDebugger: boolean) => {
      if (blockState.running) return
      abortCtrl.current = new AbortController()
      editor.commands.runCodeBlock(node.attrs, { signal: abortCtrl.current.signal, runWithDebugger })
    },
    [blockState.running, editor, node.attrs],
  )

  return (
    <RunBlockButton
      hasDebugger={hasDebugger}
      running={blockState.running}
      abortController={abortCtrl.current}
      onRun={handleRunBlock}
    />
  )
}

export default RunCodeBlockButton
