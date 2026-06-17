import { Node } from '@tiptap/core'
import { RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { getRunnableBlocks } from 'src/lib/utils'
import { clearApiBlockState } from '../RestApiBlock/plugins'
import { clearCodeBlockState } from '../RunnableCodeBlock/plugins'
import { IMultiplayerDebugger, ISecretsManager } from 'src/types'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    runnableBlocksContext: {
      runAllBlocks: (notebookDebugger?: IMultiplayerDebugger) => any
      clearAllBlocks: () => any
      cancelAllBlocks: () => void
    }
  }
}

export interface RunnableBlocksOptions {
  allowRunnableBlocks: boolean
  noteBookDebugger: IMultiplayerDebugger | null
  secretsManager: ISecretsManager | null
}

export const RunnableBlocksExtension = Node.create<RunnableBlocksOptions>({
  name: 'runnableBlocksContext',
  addOptions() {
    return { noteBookDebugger: null, allowRunnableBlocks: false, secretsManager: null }
  },
  addStorage() {
    return {
      isRunning: false,
      abortController: new AbortController(),
    }
  },
  addCommands() {
    return {
      clearAllBlocks:
        () =>
        ({ editor }) => {
          clearApiBlockState(editor.view)
          clearCodeBlockState(editor.view)
        },

      cancelAllBlocks: () => () => {
        if (this.storage.isRunning) {
          this.storage.abortController.abort()
          this.storage.isRunning = false
          this.storage.abortController = new AbortController()
        }
      },
      runAllBlocks:
        () =>
        async ({ state, editor }) => {
          if (this.storage.isRunning) {
            console.warn('Already running blocks. Cancel first before retrying.')
            return false
          }

          const nodes = getRunnableBlocks(state)
          if (nodes.length === 0) {
            return false
          }

          this.storage.isRunning = true
          this.storage.abortController = new AbortController()
          const { signal } = this.storage.abortController

          try {
            for (const node of nodes) {
              if (signal.aborted) {
                break
              }

              const { type, attrs } = node
              try {
                if (type.name === RUNNABLE_API_BLOCK_NAME) {
                  await editor.commands.runApiBlock(attrs, { signal })
                }
                if (type.name === RUNNABLE_CODE_BLOCK_NAME) {
                  await editor.commands.runCodeBlock(attrs, { signal })
                }
              } catch (error) {
                console.error(error)
                throw new Error(`Error running block "${attrs._globalName}"`)
              }
            }
          } finally {
            this.storage.isRunning = false
          }

          return true
        },
    }
  },
})
