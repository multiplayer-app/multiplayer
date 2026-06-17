import { Notebook } from '@multiplayer/types'
import AutoCompleteInput from 'src/extensions/RestApiBlock/component/AutoCompleteInput'

interface BasicProps {
  content: Notebook.AuthorizationBasic
  readOnly?: boolean
  variables?: Notebook.AggregateVariable[]
  onChange: (val: Notebook.AuthorizationBasic) => void
}

const Basic = ({ readOnly, content, onChange }: BasicProps) => {
  const handleChange = (name: string, value: string) => {
    onChange({ ...content, [name]: value })
  }
  return (
    <tbody>
      <tr>
        <td>Username</td>
        <td>
          <AutoCompleteInput
            placeholder="Username"
            readOnly={readOnly}
            value={content.username}
            onChange={v => handleChange('username', v)}
          />
        </td>
      </tr>
      <tr>
        <td>Password</td>
        <td>
          <AutoCompleteInput
            placeholder="Password"
            readOnly={readOnly}
            value={content.password}
            onChange={v => handleChange('password', v)}
          />
        </td>
      </tr>
    </tbody>
  )
}

export default Basic
