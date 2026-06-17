import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ConditionalRecordingAgentSchema } from './schema'

export const validateCheckStartConditionalRecording = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ConditionalRecordingAgentSchema.checkStartConditionalRecordingSchema,
    { updateQuery: true },
    next,
    req,
  )
}
