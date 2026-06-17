import { cn } from '../../lib/utils'
import { icons } from 'lucide-react'
import { memo } from 'react'

export type IconProps = {
  name: keyof typeof icons
  size?: string
  className?: string
  strokeWidth?: number
}

export const Icon = memo(({ name, className, size = 'size-4', strokeWidth }: IconProps) => {
  const IconComponent = icons[name]

  if (!IconComponent) {
    return null
  }

  return <IconComponent className={cn(size, className)} strokeWidth={strokeWidth || 2.5} />
})

Icon.displayName = 'Icon'
