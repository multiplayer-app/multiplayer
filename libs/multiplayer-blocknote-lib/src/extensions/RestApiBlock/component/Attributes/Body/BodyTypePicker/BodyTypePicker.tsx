import { Notebook } from '@multiplayer/types'
import { cn } from 'src/lib/utils'

interface BodyTypePickerProps {
  readOnly?: boolean
  value: Notebook.BodyType
  onChange: (val: Notebook.BodyType) => void
}

const bodyTypes = Object.values(Notebook.BodyType).filter(t => t !== Notebook.BodyType.BINARY)

const BodyTypePicker = ({ readOnly, value, onChange }: BodyTypePickerProps) => {
  return (
    <div className="flex gap-4">
      {bodyTypes.map(t => {
        const isSelected = t === value
        return (
          <button
            key={t}
            value={t}
            disabled={readOnly}
            onClick={() => onChange(t)}
            className="flex items-center gap-2 flex-wrap"
          >
            <span
              className={cn(
                'flex items-center justify-center rounded-full size-4 border',
                isSelected ? 'border-blue-500' : 'border-gray-500',
              )}
            >
              {isSelected && <span className="block size-3 rounded-full bg-blue-500" />}
            </span>
            {t}
          </button>
        )
      })}
    </div>
  )
}

export default BodyTypePicker
