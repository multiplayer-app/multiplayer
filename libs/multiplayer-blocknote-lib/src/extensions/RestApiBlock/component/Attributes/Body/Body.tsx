import { Notebook } from '@multiplayer/types'
import BodyContent from './BodyContent'
import BodyTypePicker from './BodyTypePicker'

interface BodyProps extends Notebook.AttributeComponentProps {}

const Body = ({ readOnly, attributes, updateAttributes }: BodyProps) => {
  const { type, ...restContent } = attributes.body

  const onTypeChange = (type: Notebook.BodyType) => {
    if (readOnly) return
    updateAttributes({ body: { ...attributes.body, type } })
  }

  const onContentChange = (type: Notebook.BodyType, content) => {
    if (readOnly) return
    updateAttributes({ body: { ...attributes.body, [type]: content } })
  }

  return (
    <>
      <BodyTypePicker readOnly={readOnly} value={type} onChange={onTypeChange} />
      <BodyContent readOnly={readOnly} type={type} content={restContent} onChange={onContentChange} />
    </>
  )
}

export default Body
