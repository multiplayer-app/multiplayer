import * as monaco from 'monaco-editor'
import { DropdownButton } from 'src/components/ui/Dropdown'

import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'

import { Surface } from 'src/components/ui/Surface'

import * as Popover from '@radix-ui/react-popover'
import { useState } from 'react'
interface LanguagePickerProps {
  value: string
  languages: string[]
  onChange: (val: string) => void
}

const defaultLanguages = monaco.languages
  .getLanguages()
  .map(l => l.id)
  .filter(l => !l.includes('.'))

const LanguagePicker = ({ languages, value, onChange }: LanguagePickerProps) => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Popover.Trigger asChild>
        <Toolbar.Button className="font-normal capitalize gap-2" onClick={e => e.stopPropagation()}>
          <Icon name="SquareTerminal" />
          {value}
          <Icon name="ChevronDown" className="w-3 h-3" />
        </Toolbar.Button>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" className="z-10" sideOffset={8}>
        <Surface className="flex capitalize flex-col gap-1 px-2 py-4">
          {(languages.length ? languages : defaultLanguages).map(lang => (
            <Popover.Close key={lang} asChild>
              <DropdownButton onClick={() => onChange(lang)}>{lang}</DropdownButton>
            </Popover.Close>
          ))}
        </Surface>
      </Popover.Content>
    </Popover.Root>
  )
}

export default LanguagePicker
