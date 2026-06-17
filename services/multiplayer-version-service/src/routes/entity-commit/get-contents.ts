import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { BadRequestError, InternalServerError, NotFoundError } from 'restify-errors'
import { Readable } from 'stream'
import { EntityCommitStorageType, ErrorMessage } from '@multiplayer/types'
import logger from '@multiplayer/logger'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityCommitId = req.params.entityCommitId as string

    // TODO: REMOVE_AFTER TESTING
    if ([
      '68f9ddd8da437c21eca418e2',
      '68f7b0a1b4535de1e3c85d2e',
      // production id
      '695e4e8e0814e85f3bed709c',
    ].includes(entityCommitId)) {
      throw new BadRequestError('THIS IS A TEST')
    }

    const entityCommit = await EntityCommitModel.findEntityCommitById(entityCommitId)
    if (!entityCommit)
      throw new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND)

    if (entityCommit.storageType !== EntityCommitStorageType.S3)
      throw new BadRequestError(ErrorMessage.RESTRICTED_ENTITY_COMMIT_CONTENTS_ROUTE)

    if (!entityCommit.key || !entityCommit.bucket)
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)

    const { ContentLength } = await s3.headObject(entityCommit.bucket, entityCommit.key)
    const response = await s3.downloadFile(entityCommit.key, entityCommit.bucket)

    if (!response.Body) {
      throw new NotFoundError(ErrorMessage.ENTITY_COMMIT_CONTENTS_NOT_FOUND)
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
