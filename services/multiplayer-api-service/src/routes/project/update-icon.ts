import type { Request, Response, NextFunction } from 'express'
import { ProjectModel } from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { S3_PUBLIC_BUCKET } from '../../config'
import { s3, ObjectCannedACL } from '@multiplayer/s3'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const iconPath = `workspaces/${workspaceId}/projects/${projectId}/${new ObjectId()}`

    const { writeStream, promise } = s3.streamUpload(
      iconPath,
      S3_PUBLIC_BUCKET,
      ObjectCannedACL.public_read,
    )

    req.pipe(writeStream)

    const iconData = await promise

    await ProjectModel.updateProjectById(
      projectId,
      {
        iconUrl: iconData.Location,
      },
    )

    const data = {
      url: iconData.Location,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
