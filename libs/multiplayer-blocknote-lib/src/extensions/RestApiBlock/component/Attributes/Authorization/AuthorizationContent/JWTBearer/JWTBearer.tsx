import { Notebook } from '@multiplayer/types'
import AutoCompleteInput from 'src/extensions/RestApiBlock/component/AutoCompleteInput'
import JSONInput from 'src/extensions/RestApiBlock/component/JSONInput'
import { AuthorizationAddToMap } from 'src/extensions/RestApiBlock/consts'

interface JWTBearerProps {
  content: Notebook.AuthorizationJWTBearer
  variables?: Notebook.AggregateVariable[]
  onChange: (val: Notebook.AuthorizationJWTBearer) => void
}

const JWTBearer = ({ content, onChange }: JWTBearerProps) => {
  const handleChange = e => {
    const { name, value, checked, type } = e.target
    onChange({ ...content, [name]: type === 'checkbox' ? checked : value })
  }

  return (
    <tbody>
      <tr>
        <td>Add to</td>
        <td>
          <select className="w-full" name="addTo" value={content.addTo} onChange={handleChange}>
            {Object.values(AuthorizationAddToMap).map(opt => (
              <option value={opt.key} key={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>
      </tr>
      <tr>
        <td>Algorithm</td>
        <td>
          <select className="w-full" name="algorithm" value={content.algorithm} onChange={handleChange}>
            {Object.values(Notebook.JWTAlgorithm).map(opt => (
              <option value={opt} key={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>
      </tr>
      <tr>
        <td rowSpan={2}>Secret</td>
        <td className="border-b-0">
          <AutoCompleteInput
            placeholder="Secret"
            value={content.secret}
            onChange={v => onChange({ ...content, secret: v })}
          />
        </td>
      </tr>
      <tr>
        <td>
          <label className="flex items-center gap-2 p-2">
            <input
              type="checkbox"
              name="secretEncoded"
              placeholder="Secret"
              checked={content.secretEncoded === true}
              onChange={handleChange}
            />
            Secret Base64 Encoded
          </label>
        </td>
      </tr>
      <tr>
        <td>Payload</td>
        <td>
          <JSONInput name="payload" value={content.payload} onChange={handleChange} />
        </td>
      </tr>
    </tbody>
  )
}

export default JWTBearer
