import type { Request, Response, NextFunction } from 'express'
import { TeamModel } from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { S3_PUBLIC_BUCKET } from '../../config'
import { s3, ObjectCannedACL } from '@multiplayer/s3'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.teamId as string
    const iconPath = `teams/${teamId}/${new ObjectId()}`

    const { writeStream, promise } = s3.streamUpload(
      iconPath,
      S3_PUBLIC_BUCKET,
      ObjectCannedACL.public_read,
    )

    req.pipe(writeStream)

    const iconData = await promise

    await TeamModel.updateTeamById(
      teamId,
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
