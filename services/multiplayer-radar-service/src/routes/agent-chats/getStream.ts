import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { sseBus } from '../../services/sse-bus.service'

const TERMINAL_CHAT_STATUSES = new Set(['finished', 'aborted', 'error'])

export const getStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string

    const session = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!session) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const sessionId = session._id.toString()

    const origin = req.headers.origin as string | undefined
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    let closed = false

    const cleanup = () => {
      if (closed) return
      closed = true
      unsubscribe()
      req.off('close', onClose)
    }

    const unsubscribe = sseBus.subscribe(sessionId, ({ event, data }) => {
      if (closed) return
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

      if (event === 'chat:update') {
        const chatData = data as { status?: string }
        if (TERMINAL_CHAT_STATUSES.has(chatData.status ?? '')) {
          cleanup()
          res.end()
        }
      }
    })

    const onClose = () => cleanup()
    req.on('close', onClose)
  } catch (err) {
    return next(err)
  }
}
