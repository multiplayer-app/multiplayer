import {
  IAgentChatDocument,
  AgentChatModel,
} from '@multiplayer/models'
import {
  AgentChatType,
  AgentChatAttachmentType,
  AgentChatStatus,
  ErrorMessage,
  IAgentAttachment,
  IAgentFileAttachment,
  IAgentChatMessage,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import {
  SendMessagePayload,
  SendMessagePayloadWithContent,
  AdditionalContext,
} from '@multiplayer-app/ai-agent-types'
import { s3 } from '@multiplayer/s3'
import { S3_PRIVATE_BUCKET } from '../config'

const getTemporaryTitle = (contextKey: string): string => {
  return `${contextKey} session ${new Date().toISOString()}`
}

export const createChat = async (payload: SendMessagePayload, excludeSocketId?: string): Promise<IAgentChatDocument> => {
  const targetUserId = payload.userId ?? 'guest'
  const contextKey = 'contextKey' in payload ? payload.contextKey : 'default'
  const metadata = 'metadata' in payload ? payload.metadata : {}
  const chat = await AgentChatModel.create({
    title: getTemporaryTitle(contextKey),
    type: AgentChatType.Chat,
    status: AgentChatStatus.Streaming,
    contextKey,
    userId: targetUserId,
    metadata,
    ...(payload.model ? { model: payload.model } : {}),
  })
  // this.socketService.emitChatUpdate(targetUserId, chat, excludeSocketId)

  return chat
}

export const upsertAndGetChat = async (
  payload: SendMessagePayload & { context?: AdditionalContext },
): Promise<IAgentChatDocument> => {
  const targetUserId = payload.userId ?? 'guest'
  let chat: IAgentChatDocument | undefined

  if (payload.chatId) {
    chat = await AgentChatModel.findAgentChatByChatId(payload.chatId)
    if (!chat) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }
    // Ensure chat is associated with the caller's userId
    if (chat.userId && chat.userId !== targetUserId) {
      throw new Error('Chat does not belong to this user')
    }
  }

  if (!chat) {
    chat = await createChat(payload as SendMessagePayloadWithContent)
  } else if ('model' in payload) {
    chat.model = payload.model || undefined
    chat = await AgentChatModel.updateAgentChatById(
      chat.id as string,
      { model: chat.model },
    )
  }

  return chat as IAgentChatDocument
}

// Called before saving a message to MongoDB — resolves s3Bucket from s3Key
export const prepareMessageAttachments = (message: IAgentChatMessage): IAgentChatMessage => {
  if (Array.isArray(message.attachments)) {
    message.attachments = message.attachments.map((attachment) => {
      if (attachment.type === AgentChatAttachmentType.File && attachment.metadata?.s3Key) {
        attachment.metadata.s3Bucket = S3_PRIVATE_BUCKET
      }
      return attachment
    })
  }
  return message
}

// Called when returning messages to clients — generates presigned download URLs.
// Pass a custom `expiresIn` (seconds) when the recipient may not fetch immediately
// (e.g. CLI agents that could be busy processing another turn).
export const populateAttachmentUrls = async (
  message: IAgentChatMessage,
  expiresIn?: number,
): Promise<IAgentChatMessage> => {
  if (Array.isArray(message.attachments)) {
    message.attachments = await Promise.all(
      message.attachments.map(async (attachment) => {
        if (attachment.type === AgentChatAttachmentType.File && attachment.metadata?.s3Key) {
          try {
            const bucket = attachment.metadata.s3Bucket ?? S3_PRIVATE_BUCKET
            attachment.url = await s3.getPresignedDownloadUrl(
              attachment.metadata.s3Key,
              bucket,
              expiresIn,
            )
          } catch {
            // ignore — presigned URL generation failure should not break the response
          }
        }
        return attachment
      }),
    )
  }
  return message
}
