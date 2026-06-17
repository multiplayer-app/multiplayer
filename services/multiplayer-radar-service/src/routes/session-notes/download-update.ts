import type { NextFunction, Request, Response } from 'express'
import { SessionNotesUpdateModel } from '@multiplayer/models'
import { YjsUpdateStatus } from '@multiplayer/types'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { s3 } from '@multiplayer/s3'
import { Readable } from 'stream'
import logger from '@multiplayer/logger'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const updateId = req.params.updateId as string

    const update = await SessionNotesUpdateModel.getSessionNotesUpdate(updateId)
    if (
      !update ||
      !update.workspace.equals(workspaceId) ||
      !update.project.equals(projectId) ||
      !update.session.equals(debugSessionId)
    ) {
      throw new NotFoundError('update not found')
    }

    if (!update.key || !update.bucket) {
      return next(new BadRequestError('Nothing to download'))
    }

    if (update.status === YjsUpdateStatus.IN_PROGRESS) {
      return next(new BadRequestError('Upload is not done for this update yet'))
    }

    const { ContentLength } = await s3.headObject(update.bucket, update.key)
    const response = await s3.downloadFile(update.key, update.bucket)

    if (!response.Body) {
      return next(new NotFoundError('Entity update data not found'))
    }
    const stream = response.Body as Readable

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': ContentLength,
    })

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
