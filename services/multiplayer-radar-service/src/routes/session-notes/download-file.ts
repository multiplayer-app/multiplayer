import type { NextFunction, Request, Response } from 'express'
import { SessionNoteModel } from '@multiplayer/models'
import { SessionNoteKey } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { s3 } from '@multiplayer/s3'
import { Readable } from 'stream'
import logger from '@multiplayer/logger'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const blockId = req.params.blockId as string



    // Find the session note to get the prefix
    const sessionNote = await SessionNoteModel.findSessionNote(debugSessionId)
    if (
      !sessionNote ||
      !sessionNote.workspace.equals(workspaceId) ||
      !sessionNote.project.equals(projectId) ||
      !sessionNote.session.equals(debugSessionId)
    ) {
      throw new NotFoundError('session note not found')
    }

    // Construct the S3 key for the file
    const key = `${sessionNote.prefix}/${SessionNoteKey.UPLOADS}/${blockId}`

    // Get file metadata and download from S3
    const { ContentLength, ContentType } = await s3.headObject(sessionNote.bucket, key)
    const response = await s3.downloadFile(key, sessionNote.bucket)

    if (!response.Body) {
      return next(new NotFoundError('File not found'))
    }

    const stream = response.Body as Readable

    // Set appropriate headers for image download
    res.writeHead(200, {
      'Content-Type': ContentType || 'image/png',
      'Content-Length': ContentLength,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    })

    // Stream the file to response
    stream.on('data', (chunk) => res.write(chunk))
    stream.once('end', () => {
      res.end()
    })
    stream.once('error', (err) => {
      logger.error(err)
      res.end()
    })
  } catch (err) {
    return next(err)
  }
}
