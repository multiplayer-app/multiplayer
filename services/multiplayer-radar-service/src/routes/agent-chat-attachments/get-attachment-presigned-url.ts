import { randomUUID } from 'crypto'
import type { Request, Response, NextFunction } from 'express'
import {
  PayloadTooLargeError,
  PreconditionFailedError,
} from 'restify-errors'
import { s3, S3_PRESIGNED_URL_EXPIRES } from '@multiplayer/s3'
import {
  S3_PRIVATE_BUCKET,
  ATTACHMENTS_MAX_FILE_SIZE,
  ATTACHMENTS_ALLOWED_MIME_TYPES,
} from '../../config'

export const getAttachmentUploadPresignedUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      filename,
      mimeType,
      size,
      chatId,
      userId: bodyUserId,
    } = req.body as {
      filename: string
      mimeType: string
      size: number
      chatId?: string
      userId?: string
    }

    if (size > ATTACHMENTS_MAX_FILE_SIZE) {
      throw new PayloadTooLargeError(`File size exceeds maximum of ${ATTACHMENTS_MAX_FILE_SIZE} bytes`)
    }

    if (ATTACHMENTS_ALLOWED_MIME_TYPES && ATTACHMENTS_ALLOWED_MIME_TYPES.length > 0) {
      const isAllowed = ATTACHMENTS_ALLOWED_MIME_TYPES.some((pattern) => {
        if (pattern.endsWith('/*')) {
          return mimeType.startsWith(pattern.slice(0, -2))
        }
        return mimeType === pattern
      })

      if (!isAllowed) {
        throw new PreconditionFailedError(`File type "${mimeType}" is not allowed`)
      }
    }

    const fileExtension = filename.includes('.')
      ? filename.substring(filename.lastIndexOf('.'))
      : ''
    const uniqueFilename = `${randomUUID()}${fileExtension}`
    const key = `workspaces/${workspaceId}/projects/${projectId}/chats/${chatId || 'draft'}/${uniqueFilename}`

    const url = await s3.getPresignedUploadUrl(
      key,
      S3_PRIVATE_BUCKET,
      S3_PRESIGNED_URL_EXPIRES,
    )

    return res.status(200).json({
      url,
      key,
      bucket: S3_PRIVATE_BUCKET,
      expiresIn: S3_PRESIGNED_URL_EXPIRES,
    })
  } catch (err) {
    return next(err)
  }
}
