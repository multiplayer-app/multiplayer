import type { Request, Response, NextFunction } from 'express'
import {
  Config as ModelConfig,
  AgentChatMessageModel,
} from '@multiplayer/models'
import * as ChatService from '../../services/chat.service'

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const chatId = req.params.chatId as string
    const {
      skip: _skip,
      limit: _limit,
      sortKey: _sortKey,
      sortDirection: _sortDirection,
      before,
    } = req.query
    const skip =
      'skip' in req.query ? Number(req.query.skip) : undefined
    const limit =
      'limit' in req.query ? Number(req.query.limit) : ModelConfig.LIMIT
    const sortDirection = Number(_sortDirection) || -1
    const sortKey = (_sortKey as string) || 'createdAt'

    const filter: any = {
      chat: chatId,
      project: projectId,
      workspace: workspaceId,
    }

    if (before) {
      filter.beforeMessage = before
    }

    const messages = await AgentChatMessageModel.findMessages(
      filter,
      {
        skip,
        limit,
      },
      {
        sortKey,
        sortDirection,
      },
    )

    messages.data = await Promise.all(
      messages.data.map(async (msg) => {
        (msg as any).id = msg._id
        return ChatService.populateAttachmentUrls(msg as any) as any
      }),
    )

    const data = {
      hasMore: messages.data.length >= limit,
      messages: messages.data,
      cursor: messages.cursor,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
