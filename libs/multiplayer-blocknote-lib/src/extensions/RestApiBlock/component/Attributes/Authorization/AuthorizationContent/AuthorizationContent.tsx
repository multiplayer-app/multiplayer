import Basic from './Basic'
import APIKey from './APIKey'
// import JWTBearer from './JWTBearer'
import BearerToken from './BearerToken'
import { Notebook } from '@multiplayer/types'

interface AuthorizationContentProps {
  content: any
  readOnly?: boolean
  type: Notebook.AuthorizationType
  variables?: Notebook.AggregateVariable[]
  onChange: (type: Notebook.AuthorizationType, content: any) => void
}

const AuthorizationContent = ({ readOnly, type, content, onChange }: AuthorizationContentProps) => {
  const handleChange = val => {
    onChange(type, val)
  }

  switch (type) {
    case Notebook.AuthorizationType.NONE:
      return <NoneContent />
    case Notebook.AuthorizationType.BASIC:
      return <Basic readOnly={readOnly} content={content[type]} onChange={handleChange} />
    case Notebook.AuthorizationType.API_KEY:
      return <APIKey readOnly={readOnly} content={content[type]} onChange={handleChange} />
    case Notebook.AuthorizationType.BEARER_TOKEN:
      return <BearerToken readOnly={readOnly} content={content[type]} onChange={handleChange} />
    // case Notebook.AuthorizationType.JWT_BEARER:
    //   return <JWTBearer content={content[type]}  onChange={handleChange} />
    default:
      break
  }
  return <></>
}

const NoneContent = () => {
  return (
    <tbody>
      <tr>
        <td colSpan={2}>
          <div className="text-center py-5 text-gray-500">This request does not use any authorization.</div>
        </td>
      </tr>
    </tbody>
  )
}

export default AuthorizationContent
