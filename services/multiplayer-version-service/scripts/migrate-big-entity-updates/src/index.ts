import mongo from '@multiplayer/mongo'
import {
  EntityUpdateModel,
  YjsUpdateStatus,
} from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { s3 } from '@multiplayer/s3'

(async () => {
  try {
    const S3_PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'private-bucket'

    await mongo.connect()
    let skip = 0
    let total = 0
    const errors: any[] = []
    do {
      const bigUpdates = await EntityUpdateModel.listBigUpdates(5e5, { skip, limit: 1 })
      await Promise.all(bigUpdates.data.map(async ({ _id }) => {
        try {
          const update = await EntityUpdateModel.getEntityUpdate(_id)
          if (!update.update) return
          const key = `workspaces/${update.workspace}/project-${update.project}/entity-${update.entityId}/updates/${update._id}`
          await s3.uploadFile(key, S3_PRIVATE_BUCKET, update.update)
          await EntityUpdateModel.updateEntityUpdate(update._id, {
            status: YjsUpdateStatus.DONE,
            key,
            bucket: S3_PRIVATE_BUCKET,
          }, ['update'])
        } catch (err) {
          logger.error(err)
          errors.push(err)
        }
        logger.info(`Processed ${skip + bigUpdates.data.length } out of ${bigUpdates.cursor.total}`)
      }))

      skip += bigUpdates.data.length
      total = bigUpdates.cursor.total
    } while (skip < total)

    //logger.info('errors', errors)
    logger.info('total updates migrated', total)
    logger.info('total errors', errors.length)
  } catch (err) {
    logger.error(err)
  } finally {
    await mongo.disconnect()
  }
  process.exit()
})()