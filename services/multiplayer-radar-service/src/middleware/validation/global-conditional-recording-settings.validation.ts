import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GlobalConditionalRecordingSettingsSchema } from './schema'

export const validateGetGlobalConditialRecordingSettings = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GlobalConditionalRecordingSettingsSchema.getGlobalConditionalRecordingSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateRemoteSessionRecordingSettings = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GlobalConditionalRecordingSettingsSchema.updateGlobalConditionalRecordingSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
