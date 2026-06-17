import { BlocknoteTemplates } from '@multiplayer/entity'
import { Notebook } from '@multiplayer/types'
import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'
import AutoCompleteInput from 'src/extensions/RestApiBlock/component/AutoCompleteInput'

interface UrlEncodedContentProps {
  readOnly?: boolean
  content: Notebook.UrlEncodedContentType
  onChange: (val: Notebook.UrlEncodedContentType) => void
}

const UrlEncodedContent = ({ readOnly, content, onChange }: UrlEncodedContentProps) => {
  const getEmptyProperty = () => {
    return BlocknoteTemplates.getEmptyBodyProperty(Notebook.BodyType.URL_ENCODED)
  }

  const setProperties = (properties: Notebook.UrlEncodedContentType) => {
    onChange(properties)
  }

  const addProperty = () => {
    setProperties([...content, getEmptyProperty()])
  }

  const changeProperty = (index: number, payload: Partial<Record<keyof Notebook.UrlEncodedContentItem, any>>) => {
    const updatedParams = [...content]
    updatedParams[index] = { ...updatedParams[index], ...payload }
    const last = updatedParams[updatedParams.length - 1]
    if (last.key || last.value) {
      updatedParams.push(getEmptyProperty())
    }
    setProperties(updatedParams)
  }

  const removeProperty = index => {
    const updatedParams = content.filter((_, i) => i !== index)
    if (!updatedParams.length) {
      updatedParams.push(getEmptyProperty())
    }
    setProperties(updatedParams)
  }

  const removeAllProperties = () => {
    setProperties([getEmptyProperty()])
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
              <span className="flex-1 font-normal">URL Encoded</span>
              {!readOnly && (
                <>
                  {content.length > 1 && (
                    <Toolbar.Button tooltip="Remove all" onClick={() => removeAllProperties()}>
                      <Icon name="Trash2" className="text-gray-500 inline" />
                    </Toolbar.Button>
                  )}
                  <Toolbar.Button tooltip="Add" onClick={() => addProperty()}>
                    <Icon name="Plus" className="text-gray-500 inline" />
                  </Toolbar.Button>
                </>
              )}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {content.map((param, index) => (
          <tr key={index}>
            <td>
              <input
                type="text"
                placeholder="Key"
                readOnly={readOnly}
                value={param.key}
                onChange={e => changeProperty(index, { key: e.target.value })}
              />
            </td>
            <td>
              <AutoCompleteInput
                placeholder="Value"
                readOnly={readOnly}
                value={param.value as string}
                onChange={v => changeProperty(index, { value: v })}
              />
            </td>
            <td>
              <input
                type="text"
                placeholder="Description"
                readOnly={readOnly}
                value={param.description}
                onChange={e => changeProperty(index, { description: e.target.value })}
              />
            </td>
            <td className="!text-center">
              {!readOnly && (
                <Toolbar.Button tooltip="Remove" onClick={() => removeProperty(index)}>
                  <Icon name="Trash2" className="text-gray-500 inline" />
                </Toolbar.Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default UrlEncodedContent
