import { Editor } from '@tiptap/core'
import { useState, useRef, useEffect, KeyboardEvent, useMemo } from 'react'
import iconImage from '../../assets/ai-icon.png?inline'
import SendIcon from '../../assets/send-arrow.svg?react'
import CancelIcon from '../../assets/cancel-icon.svg?react'
import StarsIcon from '../../assets/ai-stars.svg?react'
import { cn } from 'src/lib/utils'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME, CHART_BLOCK_NAME } from 'src/lib/constants'
import { Spinner } from '../ui/Spinner'

interface AiFormProps {
  editor: Editor
}

const SUGGESTIONS = ['Generate a code block', 'Make an API call']

const ADJUSTMENT_SUGGESTIONS = {
  [RUNNABLE_CODE_BLOCK_NAME]: ['Add error handling to the code', 'Optimize the code performance'],
  [RUNNABLE_API_BLOCK_NAME]: ['Add more request parameters', 'Add query parameters'],
  [CHART_BLOCK_NAME]: ['Add more data to the chart', 'Change the chart type'],
  default: ['Make it more concise', 'Add more details'],
}

let aiFormIndex = 0

const AiForm = ({ editor }: AiFormProps) => {
  const [prompt, setPrompt] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newBlock, setNewBlock] = useState<any>(null)
  const abortControllerRef = useRef<AbortController>()
  const [adjusting, setAdjusting] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    editor.state.doc.descendants(node => {
      const nodeId = node.attrs['data-ai-id']
      if (nodeId) {
        setNewBlock(prev => (prev ? prev : node))
      }
    })
  }, [editor])

  const handleSubmit = async () => {
    const message = prompt.trim()
    if (message) {
      setIsLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()
      try {
        let res
        if (adjusting) {
          res = await editor.commands.adjustBlock(
            { block: newBlock, adjustmentMessage: message, message: initialMessage },
            abortControllerRef.current.signal,
          )
        } else {
          res = await editor.commands.generateBlock(message, abortControllerRef.current.signal)
        }
        if (res.error) {
          setError(res.error)
        } else {
          setNewBlock(res)
        }
      } finally {
        setIsLoading(false)
        setAdjusting(undefined)
        abortControllerRef.current = undefined
      }
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = undefined
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getAdjustmentSuggestions = () => {
    if (!newBlock) return ADJUSTMENT_SUGGESTIONS.default

    const blockType = newBlock.type
    return ADJUSTMENT_SUGGESTIONS[blockType] || ADJUSTMENT_SUGGESTIONS.default
  }

  const handleSuggestionClick = (suggestion: string) => {
    setIsFocused(true)
    setPrompt(suggestion)
    textareaRef.current?.focus()
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = '32px'
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = scrollHeight > 32 ? `${scrollHeight}px` : '32px'
    }
  }

  useEffect(() => {
    if (prompt) {
      adjustTextareaHeight()
    }
  }, [prompt])

  const acceptBlock = () => {
    if (newBlock) {
      editor.commands.acceptBlock(newBlock.attrs?.['data-ai-id'])
      setIsFocused(false)
      setNewBlock(null)
      setPrompt('')
      setAdjusting(undefined)
      setInitialMessage('')
    }
  }

  const rejectBlock = () => {
    if (newBlock) {
      editor.commands.rejectBlock(newBlock.attrs?.['data-ai-id'])
      setIsFocused(false)
      setNewBlock(null)
      setPrompt('')
      setAdjusting(undefined)
      setInitialMessage('')
    }
  }

  const adjustBlock = () => {
    if (!initialMessage) {
      setInitialMessage(prompt)
    }
    setAdjusting(prompt)
    setPrompt('')
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  const cancelAdjustment = () => {
    setAdjusting(undefined)
    setPrompt(adjusting || '')
  }

  const hasPendingBlock = Boolean(newBlock)
  const isActive = Boolean(isFocused || hasPendingBlock || isLoading || error || adjusting)
  const isWaiting = isLoading || hasPendingBlock
  const aiInputId = useMemo(() => `ai-input-${aiFormIndex++}`, [])

  return (
    <div
      className={cn(
        'block mb-4 text-sm rounded-2xl transition-all',
        isActive ? 'bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800' : '',
      )}
    >
      <div className="flex items-start gap-2 rounded-2xl bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 pl-1 border">
        <img src={iconImage} width={24} height={24} className="mt-1" alt="AI" />
        <textarea
          rows={1}
          id={aiInputId}
          value={prompt}
          ref={textareaRef}
          disabled={isWaiting && !adjusting}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={e => setPrompt(e.target.value)}
          placeholder={adjusting ? 'Adjust the block' : 'Start typing to generate a block'}
          className="flex-1 py-1 leading-6 border-none bg-transparent resize-none min-h-[32px] max-h-[420px] overflow-y-auto text-inherit disabled:text-gray-700"
        />
        {isLoading ? (
          <Button
            onClick={handleCancel}
            variant="secondary"
            buttonSize="small"
            className="p-1 rounded-2xl group relative hover:bg-transparent"
          >
            <Spinner className="w-4 h-4 m-1 opacity-100 group-hover:hidden" />
            <CancelIcon className="hidden group-hover:block" />
          </Button>
        ) : (
          <Button
            buttonSize="small"
            variant="secondary"
            onClick={handleSubmit}
            className="p-1 rounded-2xl text-[#473CFB] hover:bg-transparent"
            disabled={!prompt.trim() || isLoading || (isWaiting && !adjusting)}
          >
            <SendIcon />
          </Button>
        )}
      </div>
      {error && <div className="text-red-500 pl-9 py-2">{error}</div>}
      {isLoading ? (
        <LoadingDots adjusting={adjusting} />
      ) : hasPendingBlock && !adjusting ? (
        <div className="p-2">
          <div className="flex gap-2 justify-end">
            <Button variant="primary" buttonSize="small" onClick={acceptBlock}>
              <Icon name="Check" />
              Accept
            </Button>
            <Button variant="danger" buttonSize="small" onClick={rejectBlock}>
              <Icon name="Trash" />
              Reject
            </Button>
            <Button variant="secondary" buttonSize="small" onClick={adjustBlock}>
              <Icon name="Pencil" />
              Adjust
            </Button>
          </div>
        </div>
      ) : isActive ? (
        <div
          className=" p-2 pl-9 flex items-start"
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="flex-1">
            <div className="text-gray-400 mb-2">Suggestions</div>
            {(adjusting ? getAdjustmentSuggestions() : SUGGESTIONS).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-0 py-1 flex items-center gap-2 text-inherit"
              >
                <StarsIcon />
                {suggestion}
              </button>
            ))}
          </div>
          {adjusting && (
            <Button variant="secondary" buttonSize="small" onClick={cancelAdjustment}>
              Cancel Adjustment
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}

const LoadingDots = ({ adjusting }: { adjusting: string | undefined }) => {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(dots => (dots === '...' ? '.' : dots + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pl-9 py-2">
      <span className="text-gray-500">
        {adjusting ? 'Adjusting block' : 'Generating block'}
        {dots}
      </span>
    </div>
  )
}

export default AiForm
