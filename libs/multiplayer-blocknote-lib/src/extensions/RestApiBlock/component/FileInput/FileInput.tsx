import { useRef, useState } from 'react'
import { Notebook } from '@multiplayer/types'

import { cn } from 'src/lib/utils'
import { Icon } from 'src/components/ui/Icon'
import Tooltip from 'src/components/ui/Tooltip'
import { Toolbar } from 'src/components/ui/Toolbar'

import { fileToBase64 } from '../../utils'

interface FileInputProps {
  value: Notebook.FileType | null
  maxSize?: number
  readOnly?: boolean
  className?: string
  onChange: (val: Notebook.FileType | null) => void
}

const FileInput = ({ value, readOnly, onChange, maxSize = 2, className = '' }: FileInputProps) => {
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = async e => {
    if (readOnly) return
    setError('')
    const file = e.target.files ? e.target.files[0] : null
    const maxAllowedSize = maxSize * 1024 * 1024
    if (file) {
      if (file.size > maxAllowedSize) {
        setError(`The selected file exceeds the maximum allowed size of ${maxSize}MB.`)
        onChange(null)
      } else {
        const base64 = await fileToBase64(file)
        const fileObject: Notebook.FileType = { name: file.name, type: file.type, size: file.size, base64 }
        onChange(fileObject)
      }
    }
  }

  return (
    <label
      className={cn('w-full', 'h-8', 'flex', 'items-center', 'px-2', error ? 'border-red-500' : '', className)}
      onClick={e => e.stopPropagation()}
    >
      <input type="file" ref={inputRef} readOnly={readOnly} className="hidden" onChange={e => onFileChange(e)} />
      {value ? (
        <div className="flex flex-1 items-center min-w-0">
          <span className="block truncate flex-1">{value.name}</span>
          <Toolbar.Button
            tooltip="Remove file"
            onClick={e => {
              e.preventDefault()
              onChange(null)
              if (inputRef.current) {
                inputRef.current.value = ''
              }
            }}
          >
            <Icon name="Trash" className="text-gray-500 inline" />
          </Toolbar.Button>
        </div>
      ) : (
        <span className="text-gray-400 mr-auto">Select file</span>
      )}
      {error ? (
        <Tooltip title={error}>
          <Icon name="CircleAlert" className="text-red-500" />
        </Tooltip>
      ) : null}
    </label>
  )
}

export default FileInput
