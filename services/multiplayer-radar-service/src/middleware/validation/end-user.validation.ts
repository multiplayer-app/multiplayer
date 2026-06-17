import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EndUserSchema } from './schema'

export const validateListEndUsers = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EndUserSchema.listEndUsersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetEndUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EndUserSchema.getEndUserSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateEndUserSessionRecordingSettings = (
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
    EndUserSchema.updateEndUserSessionRecordingSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkUpdateEndUserSessionRecordingSettings = (
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
    EndUserSchema.bulkUpdateEndUserSessionRecordingSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveEndUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EndUserSchema.removeEndUserSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkRemoveEndUsers = (
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
    EndUserSchema.bulkRemoveEndUsersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateStartRemoteSessionRecording = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EndUserSchema.startRemoteSessionRecordingSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateStopRemoteSessionRecording = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EndUserSchema.stopRemoteSessionRecordingSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkStartRemoteSessionRecording = (
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
    EndUserSchema.bulkStartRemoteSessionRecordingSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkStopRemoteSessionRecording = (
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
    EndUserSchema.bulkStopRemoteSessionRecordingSchema,
    { updateQuery: true },
    next,
    req,
  )
}
