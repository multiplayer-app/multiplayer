import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { RadarDetectionSchema } from './schema'

export const validateListRadarDetections = (
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
    RadarDetectionSchema.listRadarDetectionsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListRadarDetectedDependencies = (
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
    RadarDetectionSchema.listRadarDetectedDependenciesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListRadarDetectedEnvironments = (
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
    RadarDetectionSchema.listRadarDetectedEnvironmentsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListRadarDetectedComponents = (
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
    RadarDetectionSchema.listRadarDetectedComponentsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListRadarDetectionsParams = (
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
    RadarDetectionSchema.listRadarDetectionsParamsSchema,
    { updateQuery: true },
    next,
    req,
  )
}


export const validateBulkDeleteRadarDetectionsParams = (
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
    RadarDetectionSchema.bulkDeleteRadarDetectionsParamsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
