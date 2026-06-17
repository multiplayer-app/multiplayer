import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { FlowsSchema } from './schema'

export const validateListFlowsMetadata = (
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
    FlowsSchema.listFlowsMetadataSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkDeleteFlows = (
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
    FlowsSchema.bulkDeleteFlowsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetFlow = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    FlowsSchema.getFlowSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateFlowMetadata = (
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
    FlowsSchema.updateFlowMetadataSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateDeleteFlowById = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    FlowsSchema.deleteFlowByIdSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateAddStarToFlowMetadata = (
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
    FlowsSchema.addStarToFlowMetadataSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveStarFromFlowMetadata = (
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
    FlowsSchema.removeStarFromFlowMetadataSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListUniqueComponentsFromFlowsMetadata = (
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
    FlowsSchema.listUniqueComponentsFromFlowsMetadataSchema,
    { updateQuery: true },
    next,
    req,
  )
}
