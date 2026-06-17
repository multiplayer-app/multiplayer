import type { Request, Response, NextFunction } from 'express'
import { EndUserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endUserId = req.params.endUserId as string
    const payload = req.body

    const updatedSessionRecordingSettings = await EndUserModel.updateConditionalRecordingSettings(endUserId, payload)

    return res.status(200).json(updatedSessionRecordingSettings)
  } catch (err) {
    return next(err)
  }
}
