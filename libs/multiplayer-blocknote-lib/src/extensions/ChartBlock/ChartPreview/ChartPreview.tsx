import { Editor } from '@tiptap/core'
import { memo, useRef, useState, useCallback, useEffect } from 'react'
import { CHART_BLOCK_NAME } from 'src/lib/constants'
import { createProxyFetch } from 'src/lib/proxy-fetch'
import { getExtensionOptions } from 'src/lib/utils'

interface ChartPreviewProps {
  iframeObjectURL: string
  editor: Editor
  onHandlerRun: (handler: string, params: Record<string, any>) => Promise<any>
}

interface CustomMessageEvent extends MessageEvent {
  source: Window | null
  data: {
    type: string
    height?: number
    error?: { message: string }
    promiseId?: string
    handler?: string
    params?: Record<string, any>
    url?: string
    options?: any
  }
}

const ChartPreview = memo<ChartPreviewProps>(({ editor, iframeObjectURL, onHandlerRun }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [error, setError] = useState<string | null>(null)

  const setHeight = useCallback((height: string) => {
    if (!iframeRef.current) return
    iframeRef.current.style.height = height
  }, [])

  useEffect(() => {
    setError(null)
    return () => {
      URL.revokeObjectURL(iframeObjectURL)
    }
  }, [iframeObjectURL])

  const handleResizeMessage = useCallback(
    (event: CustomMessageEvent) => {
      const height = parseInt(event.data.height?.toString() || '0')
      if (isNaN(height)) return
      setHeight(`${height}px`)
    },
    [setHeight],
  )

  const handleErrorMessage = useCallback((event: CustomMessageEvent) => {
    const errorMessage = event.data.error?.message || 'Unknown error'
    const sanitizedMessage = errorMessage.replace(/[<>]/g, '')
    setError(sanitizedMessage)
  }, [])

  const handleHandlerMessage = useCallback(
    async (event: CustomMessageEvent) => {
      if (!event.source || !event.data.promiseId || !event.data.handler) return

      try {
        const { result: res, error } = await onHandlerRun(event.data.handler, event.data.params || {})
        const result = res?.data ? JSON.parse(res.data) : null
        event.source.postMessage(
          { error, result, promiseId: event.data.promiseId, type: 'handler-result' },
          { targetOrigin: '*' },
        )
      } catch (error: any) {
        event.source.postMessage(
          { type: 'handler-result', promiseId: event.data.promiseId, error: error.message },
          { targetOrigin: '*' },
        )
      }
    },
    [onHandlerRun],
  )

  const handleProxyFetchMessage = useCallback(
    async (event: CustomMessageEvent) => {
      if (!event.source || !event.data.promiseId || !event.data.url) return

      const proxyConfig = getExtensionOptions(editor, CHART_BLOCK_NAME).proxy

      try {
        const proxyFetch = createProxyFetch(proxyConfig)
        const response = await proxyFetch(event.data.url, event.data.options || {})
        const data = await response.json()
        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        event.source.postMessage(
          {
            type: 'proxy-fetch-result',
            promiseId: event.data.promiseId,
            data,
            status: response.status,
            statusText: response.statusText,
            headers,
          },
          { targetOrigin: '*' },
        )
      } catch (error: any) {
        event.source.postMessage(
          {
            type: 'proxy-fetch-result',
            promiseId: event.data.promiseId,
            error: error.message,
          },
          { targetOrigin: '*' },
        )
      }
    },
    [editor],
  )

  useEffect(() => {
    const allowedMessages = new Set(['resize', 'error', 'handler', 'proxy-fetch'])
    const handleMessage = async (event: Event) => {
      const messageEvent = event as unknown as CustomMessageEvent
      if (
        !messageEvent.source ||
        messageEvent.source !== iframeRef.current?.contentWindow ||
        !allowedMessages.has(messageEvent.data?.type)
      )
        return

      switch (messageEvent.data?.type) {
        case 'resize':
          handleResizeMessage(messageEvent)
          break
        case 'error':
          handleErrorMessage(messageEvent)
          break
        case 'handler':
          await handleHandlerMessage(messageEvent)
          break
        case 'proxy-fetch':
          await handleProxyFetchMessage(messageEvent)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleResizeMessage, handleErrorMessage, handleHandlerMessage, handleProxyFetchMessage])

  return (
    <div className="relative">
      <iframe
        ref={iframeRef}
        src={iframeObjectURL}
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-scripts"
        className="w-full min-h-[200px] rounded-b-lg"
      />
      {error && (
        <div className="absolute inset-0 text-red-500 text-sm p-2 min-h-[200px] font-mono whitespace-pre-wrap bg-red-50 rounded-b-lg">
          {error}
        </div>
      )}
    </div>
  )
})

export default ChartPreview
