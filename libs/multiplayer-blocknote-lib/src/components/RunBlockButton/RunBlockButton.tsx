import { Icon } from 'src/components/ui/Icon'
import { cn } from 'src/lib/utils'
import { DropdownButton } from 'src/components/ui/Dropdown'
import { Surface } from 'src/components/ui/Surface'
import * as Popover from '@radix-ui/react-popover'
import { useState, forwardRef } from 'react'

const RunBlockButton = ({ running, onRun, hasDebugger, abortController }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRunning = () => {
    if (running) {
      abortController?.abort()
    } else {
      onRun(false)
    }
  }
  return (
    <div className="flex items-center">
      <PrimaryButton onClick={toggleRunning} className={cn('pr-2', hasDebugger ? 'rounded-l-lg' : 'rounded-lg')}>
        {running ? (
          <>
            <span className="animate-spin">
              <Icon name="Loader" />
            </span>
            Stop
          </>
        ) : (
          <>
            <Icon name="Play" />
            Run
          </>
        )}
      </PrimaryButton>
      {hasDebugger && (
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger asChild>
            <PrimaryButton className="rounded-r-lg px-2 ml-[-1px]">
              <Icon name="ChevronDown" />
            </PrimaryButton>
          </Popover.Trigger>
          <Popover.Content side="bottom" align="start" className="z-10" sideOffset={8}>
            <Surface className="p-2 flex flex-col">
              <Popover.Close asChild>
                <DropdownButton disabled={running} onClick={() => onRun(true)}>
                  Run and Record
                </DropdownButton>
              </Popover.Close>
            </Surface>
          </Popover.Content>
        </Popover.Root>
      )}
    </div>
  )
}

const PrimaryButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'h-9 px-4 font-semibold flex items-center gap-2 border border-gray-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100',
          disabled
            ? 'bg-gray-300 dark:bg-neutral-700 cursor-not-allowed'
            : 'bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    )
  },
)
export default RunBlockButton
