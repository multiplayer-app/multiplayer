import { Notebook } from '@multiplayer/types'
import { BlocknoteTemplates } from '@multiplayer/entity'

import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'

interface VariablesProps extends Notebook.AttributeComponentProps {}

const Variables = ({ readOnly, attributes, updateAttributes }: VariablesProps) => {
  const setData = (variables: Notebook.RestApiBlockAttributes['variables']) => {
    if (readOnly) return
    updateAttributes({ variables })
  }

  const addParameter = () => {
    if (readOnly) return
    setData([...attributes.variables, BlocknoteTemplates.getEmptyAttribute('variables')])
  }

  const changeParameter = (index, key, value) => {
    if (readOnly) return
    const updatedParams = [...attributes.variables]
    updatedParams[index] = { ...updatedParams[index], [key]: value }
    const last = updatedParams[updatedParams.length - 1]
    if (last.key || last.value) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('variables'))
    }
    setData(updatedParams)
  }

  const removeParameter = index => {
    if (readOnly) return
    const updatedParams = attributes.variables.filter((_, i) => i !== index)
    if (!updatedParams.length) {
      updatedParams.push(BlocknoteTemplates.getEmptyAttribute('variables'))
    }
    setData(updatedParams)
  }

  const removeAllVariables = () => {
    if (readOnly) return
    setData([BlocknoteTemplates.getEmptyAttribute('variables')])
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
              <span className="flex-1">Variables</span>
              {!readOnly && (
                <>
                  {attributes.variables.length > 1 && (
                    <Toolbar.Button tooltip="Remove all" onClick={() => removeAllVariables()}>
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
        {attributes.variables.map((param, index) => (
          <tr key={index}>
            <td>
              <input
                placeholder="Key"
                value={param.key}
                readOnly={readOnly}
                onChange={e => changeParameter(index, 'key', e.target.value)}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Value"
                value={param.value}
                readOnly={readOnly}
                onChange={e => changeParameter(index, 'value', e.target.value)}
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

export default Variables
