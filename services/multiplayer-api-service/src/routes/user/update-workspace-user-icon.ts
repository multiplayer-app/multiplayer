import type { Request, Response, NextFunction } from 'express'
import { WorkspaceUserModel } from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { s3, ObjectCannedACL } from '@multiplayer/s3'
import { S3_PUBLIC_BUCKET } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const userId = String(req.session.current)
    const iconPath = `users/${userId}/${workspaceId}/${new ObjectId()}`

    const { writeStream, promise } = s3.streamUpload(
      iconPath,
      S3_PUBLIC_BUCKET,
      ObjectCannedACL.public_read,
    )

    req.pipe(writeStream)

    const iconData = await promise

    await WorkspaceUserModel.updateWorkspaceUser(
      String(req.session.current),
      workspaceId,
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
