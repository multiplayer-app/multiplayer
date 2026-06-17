import { NodeViewProps } from '@tiptap/react'
import { Notebook } from '@multiplayer/types'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { RestApiNode } from '../types'
import { setApiBlockState } from '../plugins'
import RestApiBlockProvider from './RestApiBlockContext'

import Attributes from './Attributes'
import AttributesNav from './AttributesNav'
import HttpMethod from './Attributes/HttpMethod'
import GlobalName from 'src/components/GlobalName'
import RunApiBlockButton from './RunApiBlockButton'
import HttpEndpoint from './Attributes/HttpEndpoint'
import RestApiBlockResult from './RestApiBlockResult'
import VariablesErrorCollector from './VariablesErrorCollector'
import { getExtensionOptions } from 'src/lib/utils'

type RestApiBlockComponentProps = Pick<NodeViewProps, 'node' | 'updateAttributes' | 'editor'>

export const RestApiBlockComponent = memo<RestApiBlockComponentProps>(({ node, updateAttributes, editor }) => {
  const n = node as RestApiNode
  const readOnly = !editor.isEditable
  const [activeTab, setActiveTab] = useState<Notebook.AttributesTab | ''>('')

  const onNameChange = useCallback(
    (_globalName: string) => {
      updateAttributes({ _globalName })
    },
    [updateAttributes],
  )

  useEffect(() => {
    setApiBlockState(editor.view, node.attrs._id, { globalName: node.attrs._globalName })
  }, [editor.view, node.attrs._id, node.attrs._globalName])

  const { notebookDebugger } = useMemo(() => {
    return getExtensionOptions(editor, Notebook.RUNNABLE_API_BLOCK_NAME)
  }, [editor])

  return (
    <RestApiBlockProvider editor={editor} node={n}>
      <GlobalName editor={editor} node={node} name={node.attrs._globalName} onChange={onNameChange} />
      <div className="text-sm flex flex-col gap-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-3">
        <div className="flex items-center rounded-xl p-1 gap-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-700">
          <HttpMethod readOnly={readOnly} attributes={n.attrs} updateAttributes={updateAttributes} />
          <HttpEndpoint readOnly={readOnly} editor={editor} attributes={n.attrs} updateAttributes={updateAttributes} />
          <VariablesErrorCollector />
          <RunApiBlockButton node={node} editor={editor} hasDebugger={!!notebookDebugger} />
        </div>
        <AttributesNav attributes={n.attrs} current={activeTab} onChange={t => setActiveTab(t)} />
        <Attributes readOnly={readOnly} current={activeTab} attributes={n.attrs} updateAttributes={updateAttributes} />
        <RestApiBlockResult />
      </div>
    </RestApiBlockProvider>
  )
})
