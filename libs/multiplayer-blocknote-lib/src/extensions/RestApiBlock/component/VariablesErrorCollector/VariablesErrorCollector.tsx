import { Icon } from 'src/components/ui/Icon'
import * as Popover from '@radix-ui/react-popover'
import { Surface } from 'src/components/ui/Surface'
import Tooltip from 'src/components/ui/Tooltip'
import { useRestApiBlock } from '../RestApiBlockContext'

const VariablesErrorCollector = () => {
  const { errors } = useRestApiBlock()
  if (errors.length) {
    return (
      <Popover.Root>
        <Tooltip title="Missing variables" className="mx-2" tippyOptions={{ delay: 0 }}>
          <Popover.Trigger>
            <Icon name="TriangleAlert" className="text-red-500 size-5" />
          </Popover.Trigger>
        </Tooltip>
        <Popover.Content side="bottom" sideOffset={16} asChild>
          <Surface className="p-2 flex flex-col gap-4">
            {errors.map((err, i) => (
              <div className="flex gap-2" key={i}>
                {err.type === 'missing' ? (
                  <Icon name="TriangleAlert" className="text-red-500 size-5" />
                ) : (
                  <Icon name="CircleAlert" className="text-orange-500 size-5" />
                )}
                <span className="text-sm text-gray-600">{err.message}</span>
              </div>
            ))}
          </Surface>
        </Popover.Content>
      </Popover.Root>
    )
  } else {
    return null
  }
}

export default VariablesErrorCollector
