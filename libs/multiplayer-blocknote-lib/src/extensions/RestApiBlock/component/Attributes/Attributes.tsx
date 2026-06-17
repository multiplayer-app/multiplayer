import Body from './Body'
import Headers from './Headers'
import Variables from './Variables'
import Parameters from './Parameters'
import Authorization from './Authorization'
import { Notebook } from '@multiplayer/types'

interface AttributesProps extends Notebook.AttributeComponentProps {
  current: Notebook.AttributesTab | ''
}

const Attributes = ({ readOnly, current, attributes, updateAttributes }: AttributesProps) => {
  switch (current) {
    case Notebook.AttributesTab.BODY:
      return <Body readOnly={readOnly} attributes={attributes} updateAttributes={updateAttributes} />
    case Notebook.AttributesTab.HEADERS:
      return <Headers readOnly={readOnly} attributes={attributes} updateAttributes={updateAttributes} />
    case Notebook.AttributesTab.VARIABLES:
      return <Variables readOnly={readOnly} attributes={attributes} updateAttributes={updateAttributes} />
    case Notebook.AttributesTab.PARAMETERS:
      return <Parameters readOnly={readOnly} attributes={attributes} updateAttributes={updateAttributes} />
    case Notebook.AttributesTab.AUTHORIZATION:
      return <Authorization readOnly={readOnly} attributes={attributes} updateAttributes={updateAttributes} />
    default:
      return null
  }
}

export default Attributes
