import { useMemo } from 'react'
import { Editor } from '@tiptap/core'
import { Notebook } from '@multiplayer/types'
import { BlocknoteTemplates } from '@multiplayer/entity'

import QueryParams from 'src/lib/queryParams'
import { getExtensionStorage } from 'src/lib/utils'
import { RUNNABLE_API_BLOCK_NAME } from 'src/lib/constants'
import AutoCompleteInput from '../../AutoCompleteInput'

interface HttpEndpointProps extends Notebook.AttributeComponentProps {
  editor: Editor
}

const HttpEndpoint = ({ readOnly, editor, attributes, updateAttributes }: HttpEndpointProps) => {
  const updateUrl = url => {
    const queryString = url.split('?')[1] || ''
    const parameters = Array.from(new QueryParams(queryString)).map(([key, value], index) => ({
      key,
      value,
      description: attributes.parameters[index]?.description || '',
    }))
    parameters.push(BlocknoteTemplates.getEmptyAttribute('parameters'))
    updateAttributes({ url, parameters })
  }

  const autoFocus = useMemo(() => {
    const storage = getExtensionStorage(editor, RUNNABLE_API_BLOCK_NAME)
    if (storage?.focusId === attributes._id) {
      storage.focusId = null
      return true
    }
    return false
  }, [editor, attributes._id])

  return (
    <AutoCompleteInput
      className="flex-1"
      autoFocus={autoFocus}
      value={attributes.url}
      multiline={true}
      placeholder="Enter URL or past text"
      readOnly={readOnly}
      onChange={updateUrl}
    />
  )
}

export default HttpEndpoint
