import React from 'react'
import { Placement, Props } from 'tippy.js'

export interface TooltipProps {
  children?: string | React.ReactNode
  enabled?: boolean
  title?: string | React.ReactNode
  shortcut?: string[]
  tippyOptions?: Omit<Partial<Props>, 'content'>
  content?: React.ReactNode
  className?: string
}

export interface TippyProps {
  'data-placement': Placement
  'data-reference-hidden'?: string
  'data-escaped'?: string
}
