import { Notebook } from '@multiplayer/types'
import * as Dropdown from '@radix-ui/react-dropdown-menu'

import { Icon } from 'src/components/ui/Icon'
import { Toolbar } from 'src/components/ui/Toolbar'
import { Surface } from 'src/components/ui/Surface'

import { AuthorizationTypesMap } from 'src/extensions/RestApiBlock/consts'

interface TypePickerProps {
  value: Notebook.AuthorizationType
  readOnly?: boolean
  onChange: (val: Notebook.AuthorizationType) => void
}

const types = Object.values(AuthorizationTypesMap)

const AuthorizationTypePicker = ({ readOnly, value, onChange }: TypePickerProps) => {
  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger asChild disabled={readOnly}>
        <Toolbar.Button
          disabled={readOnly}
          className="font-normal gap-2 px-0 hover:bg-transparent active:bg-transparent"
        >
          {AuthorizationTypesMap[value].label}
          <Icon name="ChevronDown" className="w-3 h-3" />
        </Toolbar.Button>
      </Dropdown.Trigger>
      <Dropdown.Content asChild className="z-10 max-w-[160px] max-h-[220px] overflow-auto">
        <Surface className="flex flex-col gap-1 px-2 py-4">
          {types.map(t => (
            <Dropdown.Item asChild key={t.key} onClick={() => onChange(t.key)}>
              <Toolbar.Button className="justify-start">{t.label}</Toolbar.Button>
            </Dropdown.Item>
          ))}
        </Surface>
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

export default AuthorizationTypePicker
