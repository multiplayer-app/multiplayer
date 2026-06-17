import { PluginKey, Plugin } from '@tiptap/pm/state'
import { CHART_BLOCK_NAME, RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'

const preventBlocks = [CHART_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME, RUNNABLE_API_BLOCK_NAME]

export const preventDeleteBlock = pluginKey =>
  new Plugin({
    key: new PluginKey(pluginKey),
    props: {
      handleKeyDown(view, event) {
        if (event.key === 'Backspace') {
          const { state } = view
          const { selection } = state
          const { $head } = selection

          return preventBlocks.includes($head.nodeBefore?.type.name || '')
        }
        return false
      },
    },
  })
