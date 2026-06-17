import { Notebook } from '@multiplayer/types'

import { cn } from 'src/lib/utils'
import { Icon } from 'src/components/ui/Icon'
import { TabConfigs } from 'src/extensions/RestApiBlock/consts'

import { getAttributeState } from '../../utils'
import { useRestApiBlock } from '../RestApiBlockContext'

interface AttributesNavProps {
  current: Notebook.AttributesTab | ''
  attributes: Notebook.RestApiBlockAttributes
  onChange: (tab: Notebook.AttributesTab | '') => void
}

const AttributesNav = ({ attributes, current, onChange }: AttributesNavProps) => {
  const { errors } = useRestApiBlock()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {TabConfigs.map(tab => {
        const state = getAttributeState(attributes, tab.key)
        const isActive = current === tab.key
        const varError = errors.find(e => e.path.startsWith(tab.key))
        const color = varError ? 'red-500' : '[#473CFB]'

        return (
          <button
            key={tab.key}
            className={cn(
              'h-6 rounded-full flex items-center gap-2 pl-1 pr-2 font text-xs font-medium transition-colors',
              isActive
                ? `bg-${color} text-white`
                : 'bg-gray-100 text-[#394150] dark:bg-neutral-800 dark:text-neutral-100',
              tab.className,
            )}
            onClick={() => onChange(current === tab.key ? '' : tab.key)}
          >
            <div
              className={cn(
                'rounded-full bg-gray-500 h-4 min-w-4 text-center ',
                isActive
                  ? `bg-white text-${color}`
                  : state
                    ? `bg-${color} text-white`
                    : 'bg-[#6C727F] text-white dark:bg-neutral-600',
              )}
            >
              {state ? (
                typeof state === 'number' ? (
                  <span className="px-1">{state}</span>
                ) : (
                  <Icon name="Check" />
                )
              ) : (
                <Icon name="Plus" />
              )}
            </div>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default AttributesNav
