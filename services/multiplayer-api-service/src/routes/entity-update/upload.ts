import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'
import { EntityUpdateModel } from '@multiplayer/models'
import { YjsUpdateStatus } from '@multiplayer/types'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { KAFKA_ENTITY_UPDATES_TOPIC, S3_PRIVATE_BUCKET } from '../../config'
import { kafkaProducer } from '../../kafka'
import { EntityUpdateHelper } from '../../helpers'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string
    const entityUpdateId = req.params.entityUpdateId as string

    const update = await EntityUpdateModel.getEntityUpdate(entityUpdateId)
    if (
      !update ||
      !update.workspace.equals(workspaceId) ||
      !update.project.equals(projectId) ||
      !update.entityId.equals(entityId)
    ) {
      throw new NotFoundError('Entity update not found')
    }

    if (update.status === YjsUpdateStatus.DONE) {
      throw new BadRequestError('Update is already uploaded')
    }
    const key = EntityUpdateHelper.getS3Key({
      workspaceId,
      projectId,
      entityId,
      entityUpdateId,
    })

    const { writeStream, promise } = s3.streamUpload(
      key,
      S3_PRIVATE_BUCKET,
    )

    req.pipe(writeStream)


    const data = await promise
    await EntityUpdateModel.updateEntityUpdate(entityUpdateId, {
      status: YjsUpdateStatus.DONE,
      key,
      bucket: S3_PRIVATE_BUCKET,
    })
    await kafkaProducer.send(KAFKA_ENTITY_UPDATES_TOPIC, {
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
      entityId: entityId,
    })
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}