import { Notebook } from '@multiplayer/types'
import AutoCompleteInput from 'src/extensions/RestApiBlock/component/AutoCompleteInput'
import { AuthorizationAddToMap } from 'src/extensions/RestApiBlock/consts'

interface APIKeyProps {
  content: Notebook.AuthorizationAPIKey
  readOnly?: boolean
  variables?: Notebook.AggregateVariable[]
  onChange: (val: Notebook.AuthorizationAPIKey) => void
}

const APIKey = ({ readOnly, content, onChange }: APIKeyProps) => {
  const handleChange = (name: string, value: string) => {
    onChange({ ...content, [name]: value })
  }
  return (
    <tbody>
      <tr>
        <td>Key</td>
        <td>
          <AutoCompleteInput
            readOnly={readOnly}
            placeholder="Key"
            value={content.key}
            onChange={v => handleChange('key', v)}
          />
        </td>
      </tr>
      <tr>
        <td>Value</td>
        <td>
          <AutoCompleteInput
            readOnly={readOnly}
            placeholder="Value"
            value={content.value}
            onChange={v => handleChange('value', v)}
          />
        </td>
      </tr>
      <tr>
        <td>Add to</td>
        <td>
          <select
            name="addTo"
            className="w-full"
            disabled={readOnly}
            value={content.addTo}
            onChange={e => handleChange('addTo', e.target.value)}
          >
            {Object.values(AuthorizationAddToMap).map(opt => (
              <option value={opt.key} key={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>
      </tr>
    </tbody>
  )
}

export default APIKey
