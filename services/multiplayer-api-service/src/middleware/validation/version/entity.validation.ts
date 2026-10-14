import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EntitySchema } from './schema'

export const validateListAllEntityAliases = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.listAllEntityAliasesSchema,
    { updateQuery: true },
    next,
    req,
  )
}
export const validateCommitEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.commitEntitySchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListEntities = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.listEntitiesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.getEntitySchema,
    {},
    next,
  )
}
export const validateGetEntityContent = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.getEntityContentSchema,
    {},
    next,
  )
}

export const validateCreateEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
    file: req.file,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.createEntitySchema,
    {},
    next,
  )
}

export const validateBulkCreateEntities = (
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
    EntitySchema.bulkCreateEntitiesSchema,
    {},
    next,
  )
}

export const validateBulkUpdateEntities = (
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
    EntitySchema.bulkUpdateEntitiesSchema,
    {},
    next,
  )
}

export const validateBulkDeleteEntities = (
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
    EntitySchema.bulkDeleteEntitiesSchema,
    {},
    next,
  )
}

export const validateDeleteEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.deleteEntitySchema,
    {},
    next,
  )
}

export const validateAiCreateEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.aiCreateEntitySchema,
    {},
    next,
  )
}

export const validateUpdateEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.updateEntitySchema,
    {},
    next,
  )
}
export const validateRevertEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.revertEntitySchema,
    {},
    next,
  )
}
export const validateInternalUpdateEntity = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.internalUpdateEntitySchema,
    {},
    next,
  )
}

export const validateMergeEntities = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.mergeEntitiesSchema,
    {},
    next,
  )
}

export const validateEntityAccessUpdate = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntitySchema.entityAccessUpdateSchema,
    { updateQuery: true },
    next,
    req,
  )
}
