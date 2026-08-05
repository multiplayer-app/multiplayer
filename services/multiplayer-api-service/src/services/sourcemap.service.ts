import { Readable, PassThrough } from 'stream'
import { s3 } from '@multiplayer/s3'
import logger from '@multiplayer/logger'
import {
  IReleaseDocument,
  ReleaseModel,
} from '@multiplayer/models'
import { InternalServerError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { SourceMapHelper } from '../helpers'
import { S3_PRIVATE_BUCKET } from '../config'

export const uploadSourcemap = async (
  release: IReleaseDocument,
  filePath: string,
): Promise<{
  writeStream: PassThrough,
  promise: Promise<any>,
}> => {
  try {
    const s3Key = SourceMapHelper.getS3Key({
      workspaceId: release.workspace.toString(),
      projectId: release.project.toString(),
      releaseId: release._id.toString(),
      entityId: release.entity.toString(),
      filePath,
    })

    const { writeStream, promise } = s3.streamUpload(
      s3Key,
      S3_PRIVATE_BUCKET,
    )

    await ReleaseModel.updateReleaseById(release._id, {
      sourceMap: {
        key: s3Key,
        bucket: S3_PRIVATE_BUCKET,
      },
    })

    return {
      writeStream,
      promise,
    }
  } catch (err) {
    logger.error({ err }, 'Failed to upload sourcemap')
    throw new InternalServerError(ErrorMessage.INTERNAL_ERROR)
  }
}
