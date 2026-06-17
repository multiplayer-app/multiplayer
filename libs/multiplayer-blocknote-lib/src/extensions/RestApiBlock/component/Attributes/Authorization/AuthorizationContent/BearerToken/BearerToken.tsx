import { Notebook } from '@multiplayer/types'
import AutoCompleteInput from 'src/extensions/RestApiBlock/component/AutoCompleteInput'

interface BearerTokenProps {
  readOnly?: boolean
  variables?: Notebook.AggregateVariable[]
  content: Notebook.AuthorizationBearerToken
  onChange: (val: Notebook.AuthorizationBearerToken) => void
}

const BearerToken = ({ readOnly, content, onChange }: BearerTokenProps) => {
  const handleChange = (name: string, value: string) => {
    onChange({ ...content, [name]: value })
  }
  return (
    <tbody>
      <tr>
        <td>Token</td>
        <td>
          <AutoCompleteInput
            readOnly={readOnly}
            placeholder="Token"
            value={content.token}
            onChange={v => handleChange('token', v)}
          />
        </td>
      </tr>
    </tbody>
  )
}

export default BearerToken
