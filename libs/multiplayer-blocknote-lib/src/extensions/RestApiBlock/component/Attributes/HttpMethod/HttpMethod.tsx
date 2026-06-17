import { useState } from 'react'
import { Notebook } from '@multiplayer/types'
import * as Popover from '@radix-ui/react-popover'

import { Icon } from 'src/components/ui/Icon'
import { Surface } from 'src/components/ui/Surface'
import { DropdownButton } from 'src/components/ui/Dropdown'
import { HttpMethodConfigs } from 'src/extensions/RestApiBlock/consts'

const httpMethods = Object.values(Notebook.HttpMethodEnum)

interface HttpMethodProps extends Notebook.AttributeComponentProps {}

const HttpMethod = ({ readOnly, attributes, updateAttributes }: HttpMethodProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const methodConf = HttpMethodConfigs[attributes.method] || HttpMethodConfigs.GET

  return (
    <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Popover.Trigger asChild>
        <button
          disabled={readOnly}
          className="h-9 rounded-lg px-4 font-['JetBrains_Mono'] font-semibold flex items-center gap-2"
          style={{ color: methodConf.color, background: methodConf.color + '1A' }}
        >
          {attributes.method}
          <Icon name="ChevronDown" size="size-5" />
        </button>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start" className="z-10" sideOffset={8}>
        <Surface className="p-2 flex flex-col ">
          {httpMethods.map(method => (
            <Popover.Close key={method}>
              <DropdownButton
                as="div"
                onClick={() => updateAttributes({ method })}
                className="font-['JetBrains Mono'] font-medium"
                style={{ color: HttpMethodConfigs[method].color }}
              >
                {method}
              </DropdownButton>
            </Popover.Close>
          ))}
        </Surface>
      </Popover.Content>
    </Popover.Root>
  )
}

export default HttpMethod
