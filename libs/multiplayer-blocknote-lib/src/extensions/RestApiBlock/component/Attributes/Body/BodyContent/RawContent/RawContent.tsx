import { Notebook } from '@multiplayer/types'
import CodeEditor from 'src/components/CodeEditor'
import { RawContentLanguagesMap } from 'src/extensions/RestApiBlock/consts'

interface RawContentProps {
  readOnly?: boolean
  content: Notebook.RawContentType
  onChange: (val: Notebook.RawContentType) => void
}
const languages = Object.keys(RawContentLanguagesMap)

const RawContent = ({ readOnly, content, onChange }: RawContentProps) => {
  return (
    <CodeEditor
      minHeight={60}
      value={content.value}
      languages={languages}
      options={{ readOnly }}
      language={content.type || Notebook.RawContentLang.TEXT}
      onChange={(value = '') => onChange({ ...content, value })}
      onLanguageChange={lang => onChange({ ...content, type: lang as Notebook.RawContentLang })}
    />
  )
}

export default RawContent
