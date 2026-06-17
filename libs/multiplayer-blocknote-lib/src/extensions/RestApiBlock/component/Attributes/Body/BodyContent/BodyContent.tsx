import { Notebook } from '@multiplayer/types'
import RawContent from './RawContent'
import BinaryContent from './BinaryContent'
import FormDataContent from './FormDataContent'
import UrlEncodedContent from './UrlEncodedContent'

interface BodyContentProps {
  content: any
  type: Notebook.BodyType
  readOnly?: boolean
  variables?: Notebook.AggregateVariable[]
  onChange: (type: Notebook.BodyType, content: any) => void
}

const BodyContent = ({ readOnly, type, content, onChange }: BodyContentProps) => {
  const handleChange = val => {
    if (readOnly) return
    onChange(type, val)
  }

  switch (type) {
    case Notebook.BodyType.NONE:
      return <NoneContent />
    case Notebook.BodyType.RAW:
      return <RawContent readOnly={readOnly} content={content[type]} onChange={handleChange} />
    case Notebook.BodyType.BINARY:
      return <BinaryContent readOnly={readOnly} content={content[type]} onChange={handleChange} />
    case Notebook.BodyType.FORM_DATA:
      return <FormDataContent readOnly={readOnly} content={content[type] || []} onChange={handleChange} />
    case Notebook.BodyType.URL_ENCODED:
      return <UrlEncodedContent readOnly={readOnly} content={content[type] || []} onChange={handleChange} />
    default:
      break
  }
  return <></>
}

const NoneContent = () => {
  return (
    <div className="text-center py-5 text-gray-500 dark:text-neutral-200 rounded-lg border border-gray-200 dark:border-neutral-700">
      This request does not have body
    </div>
  )
}

export default BodyContent
