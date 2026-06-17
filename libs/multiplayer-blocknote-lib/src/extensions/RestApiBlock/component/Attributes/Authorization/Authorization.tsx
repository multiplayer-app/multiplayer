import { Notebook } from '@multiplayer/types'
import AuthorizationContent from './AuthorizationContent'
import AuthorizationTypePicker from './AuthorizationTypePicker'

interface AuthorizationProps extends Notebook.AttributeComponentProps {}

const Authorization = ({ readOnly, attributes, updateAttributes }: AuthorizationProps) => {
  const { type, ...restContent } = attributes.authorization

  const onTypeChange = (type: Notebook.AuthorizationType) => {
    if (readOnly) return
    updateAttributes({ authorization: { ...attributes.authorization, type } })
  }

  const onContentChange = (type: Notebook.AuthorizationType, content) => {
    if (readOnly) return
    updateAttributes({ authorization: { ...attributes.authorization, [type]: content } })
  }

  return (
    <table className="w-full rounded no-padding first-col-label">
      <colgroup>
        <col className="w-40" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th colSpan={2}>
            <div className="px-2 py-1 gap-2 flex items-center">
              <AuthorizationTypePicker readOnly={readOnly} value={type} onChange={onTypeChange} />
            </div>
          </th>
        </tr>
      </thead>
      <AuthorizationContent readOnly={readOnly} type={type} content={restContent} onChange={onContentChange} />
    </table>
  )
}

export default Authorization
