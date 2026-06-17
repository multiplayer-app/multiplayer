import { useRestApiBlock } from '../RestApiBlockContext'

import { useCallback, useRef } from 'react'
import RunBlockButton from 'src/components/RunBlockButton'

const RunApiBlockButton = ({ node, editor, hasDebugger }) => {
  const { blockState } = useRestApiBlock()
  const abortCtrl = useRef<AbortController>()

  const handleRunBlock = useCallback(
    (runWithDebugger: boolean) => {
      if (blockState.running) return
      abortCtrl.current = new AbortController()
      editor.commands.runApiBlock(node.attrs, { signal: abortCtrl.current.signal, runWithDebugger })
    },
    [blockState.running, editor, node.attrs],
  )
  return (
    <RunBlockButton
      running={blockState.running}
      hasDebugger={hasDebugger}
      abortController={abortCtrl.current}
      onRun={handleRunBlock}
    />
  )
}

export default RunApiBlockButton
