import { Notebook } from '@multiplayer/types'
import FileInput from 'src/extensions/RestApiBlock/component/FileInput'

interface BinaryContentProps {
  readOnly?: boolean
  content: Notebook.BinaryContentType
  onChange: (val: Notebook.BinaryContentType) => void
}

const BinaryContent = ({ readOnly, content, onChange }: BinaryContentProps) => {
  return (
    <FileInput readOnly={readOnly} value={content} onChange={onChange} className="border rounded max-w-[450px] h-10" />
  )
}

export default BinaryContent
