import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'
import { s3 } from '@multiplayer/s3'
import { BadRequestError, InternalServerError, NotFoundError } from 'restify-errors'
import { Readable } from 'stream'
import { EntityCommitStorageType, ErrorMessage } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { downloadFileAsByteArray } from '@multiplayer/s3/dist/s3.lib'
import { EntityConverter } from '@multiplayer/entity'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityCommitId = req.params.entityCommitId as string

    const entityCommit = await EntityCommitModel.findEntityCommitById(entityCommitId)
    if (!entityCommit)
      return next(new NotFoundError(ErrorMessage.ENTITY_COMMIT_NOT_FOUND))

    if (entityCommit.storageType !== EntityCommitStorageType.S3)
      return next(new BadRequestError(ErrorMessage.RESTRICTED_ENTITY_COMMIT_CONTENTS_ROUTE))

    if (!entityCommit.key || !entityCommit.bucket)
      return next(new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))

    const { ContentLength } = await s3.headObject(entityCommit.bucket, entityCommit.key)
    const response = await s3.downloadFileAsByteArray(entityCommit.key, entityCommit.bucket)
    if (!response) {
      return res.status(200).json(undefined)
    }
    const data = EntityConverter.convertStateToData(entityCommit.entityType, response)
    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
