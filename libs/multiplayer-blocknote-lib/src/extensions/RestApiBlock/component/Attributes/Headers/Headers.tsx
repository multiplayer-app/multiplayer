import { Notebook } from '@multiplayer/types'
import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'

import AutoCompleteInput from '../../AutoCompleteInput'
import { BlocknoteTemplates } from '@multiplayer/entity'

interface HeadersProps extends Notebook.AttributeComponentProps {}

const Headers = ({ readOnly, attributes, updateAttributes }: HeadersProps) => {
  const setHeaders = (headers: Notebook.RestApiBlockAttributes['headers']) => {
    if (readOnly) return
    updateAttributes({ headers })
  }

  const addHeader = () => {
    if (readOnly) return
    setHeaders([...attributes.headers, BlocknoteTemplates.getEmptyAttribute('headers')])
  }

  const changeHeader = (index, key, value) => {
    if (readOnly) return
    const updatedParams = [...attributes.headers]
    updatedParams[index] = { ...updatedParams[index], [key]: value }
    const last = updatedParams[updatedParams.length - 1]
    if (last.key || last.value) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('headers'))
    }
    setHeaders(updatedParams)
  }

  const removeHeader = index => {
    if (readOnly) return
    const updatedParams = attributes.headers.filter((_, i) => i !== index)
    if (!updatedParams.length) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('headers'))
    }
    setHeaders(updatedParams)
  }

  const removeAllHeaders = () => {
    if (readOnly) return
    setHeaders([BlocknoteTemplates.getEmptyAttribute('headers')])
  }

  return (
    <table className="w-full table-fixed rounded no-padding">
      <colgroup>
        <col />
        <col />
        <col />
        <col className="w-12" />
      </colgroup>
      <thead>
        <tr>
          <th colSpan={4}>
            <div className="px-2 py-1 gap-2 flex items-center">
              <span className="flex-1">Headers</span>
              {!readOnly && (
                <>
                  {attributes.headers.length > 1 && (
                    <Toolbar.Button tooltip="Remove all" onClick={() => removeAllHeaders()}>
                      <Icon name="Trash2" className="text-gray-500 inline	" />
                    </Toolbar.Button>
                  )}
                  <Toolbar.Button tooltip="Add" onClick={() => addHeader()}>
                    <Icon name="Plus" className="text-gray-500 inline	" />
                  </Toolbar.Button>
                </>
              )}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {attributes.headers.map((param, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                placeholder="Key"
                value={param.key}
                readOnly={readOnly}
                onChange={e => changeHeader(index, 'key', e.target.value)}
              />
            </td>
            <td>
              <AutoCompleteInput
                placeholder="Value"
                value={param.value}
                readOnly={readOnly}
                onChange={v => changeHeader(index, 'value', v)}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Description"
                value={param.description}
                readOnly={readOnly}
                onChange={e => changeHeader(index, 'description', e.target.value)}
              />
            </td>
            <td className="w-10 !text-center">
              {!readOnly && (
                <Toolbar.Button tooltip="Remove" onClick={() => removeHeader(index)}>
                  <Icon name="Trash2" className="text-gray-500 inline	" />
                </Toolbar.Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Headers
