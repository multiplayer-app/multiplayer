import { Notebook } from '@multiplayer/types'
import { BlocknoteTemplates } from '@multiplayer/entity'

import QueryParams from 'src/lib/queryParams'
import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'
import AutoCompleteInput from '../../AutoCompleteInput'

interface ParametersProps extends Notebook.AttributeComponentProps {}

const Parameters = ({ readOnly, attributes, updateAttributes }: ParametersProps) => {
  const setParameters = (parameters: Notebook.RestApiBlockAttributes['parameters']) => {
    if (readOnly) return
    const params = parameters.map(({ key, value }) => [key, value]).filter(([key]) => !!key)
    const query = new QueryParams(params)

    let url = attributes.url.split('?')[0] || ''
    if (query.size) {
      url += `?${query.toString()}`
    }
    updateAttributes({ parameters, url })
  }

  const addParameter = () => {
    if (readOnly) return
    setParameters([...attributes.parameters, BlocknoteTemplates.getEmptyAttribute('parameters')])
  }

  const changeParameter = (index, key, value) => {
    if (readOnly) return
    const updatedParams = [...attributes.parameters]
    updatedParams[index] = { ...updatedParams[index], [key]: value }
    const last = updatedParams[updatedParams.length - 1]
    if (last.key || last.value) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('parameters'))
    }
    setParameters(updatedParams)
  }

  const removeParameter = index => {
    if (readOnly) return
    const updatedParams = attributes.parameters.filter((_, i) => i !== index)
    if (!updatedParams.length) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('parameters'))
    }
    setParameters(updatedParams)
  }

  const removeAllParameters = () => {
    if (readOnly) return
    setParameters([BlocknoteTemplates.getEmptyAttribute('parameters')])
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
              <span className="flex-1">Query Parameters</span>
              {!readOnly && (
                <>
                  {attributes.parameters.length > 1 && (
                    <Toolbar.Button tooltip="Remove all" onClick={() => removeAllParameters()}>
                      <Icon name="Trash2" className="text-gray-500 inline	" />
                    </Toolbar.Button>
                  )}
                  <Toolbar.Button tooltip="Add" onClick={() => addParameter()}>
                    <Icon name="Plus" className="text-gray-500 inline	" />
                  </Toolbar.Button>
                </>
              )}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {attributes.parameters.map((param, index) => (
          <tr key={index}>
            <td>
              <AutoCompleteInput
                readOnly={readOnly}
                placeholder="Key"
                value={param.key}
                onChange={v => changeParameter(index, 'key', v)}
              />
            </td>
            <td>
              <AutoCompleteInput
                placeholder="Value"
                readOnly={readOnly}
                value={param.value}
                onChange={v => changeParameter(index, 'value', v)}
              />
            </td>
            <td>
              <input
                placeholder="Description"
                readOnly={readOnly}
                value={param.description}
                onChange={e => changeParameter(index, 'description', e.target.value)}
              />
            </td>
            <td className="w-10 !text-center">
              {!readOnly && (
                <Toolbar.Button tooltip="Remove" onClick={() => removeParameter(index)}>
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

export default Parameters
