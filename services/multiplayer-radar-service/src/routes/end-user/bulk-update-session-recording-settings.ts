import type { Request, Response, NextFunction } from 'express'
import { EndUserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      ids,
      ...payload
    } = req.body

    const updatedSessionRecordingSettings = await EndUserModel.bulkUpdateRemoteSessionRecordingSettings(
      ids,
      payload,
    )

    return res.status(200).json(updatedSessionRecordingSettings)
  } catch (err) {
    return next(err)
  }
}
