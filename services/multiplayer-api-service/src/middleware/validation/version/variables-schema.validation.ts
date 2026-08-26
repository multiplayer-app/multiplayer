import type { Request, Response, NextFunction } from 'express'
import {
  InvalidArgumentError,
  NotFoundError,
} from 'restify-errors'
import { JoiValidator } from '@multiplayer/util'
import {
  EntityModel,
  EnvironmentModel,
} from '@multiplayer/models'
import {
  VariableSchemaEntityType,
  VariableSchemaType,
} from '@multiplayer/types'
import { VariableSchemaSchema } from './schema'

export const validateListVariableSchemas = (
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
    VariableSchemaSchema.listVariableSchemasSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetChangedVariableSchemas = (
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
    VariableSchemaSchema.getChangedVariableSchemasSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetVariableSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableSchemaSchema.getVariableSchemaSchema,
    {},
    next,
  )
}

export const validateCreateVariableSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableSchemaSchema.createVariableSchemaSchema,
    {},
    next,
  )
}

export const validateUpdateVariableSchema = (
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
    VariableSchemaSchema.updateVariableSchemaSchema,
    {},
    next,
  )
}

export const validateDeleteVariableSchema = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableSchemaSchema.deleteVariableSchemaSchema,
    {},
    next,
  )
}

export const validateCanCreateVariableSchemaForEntity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    entity: entityId,
    entityType,
    type,
  } = req.body

  let entity

  if (entityType === VariableSchemaEntityType.ENTITY) {
    entity = await EntityModel.findOne({ entityId })
  } else if (entityType === VariableSchemaEntityType.ENVIRONMENT) {
    entity = await EnvironmentModel.findOne({ environmentId: entityId })
  } else {
    return next(new InvalidArgumentError(`Failed to get entity for type: ${entityType}`))
  }

  if (!entity) {
    return next(new NotFoundError('Entity not found'))
  }

  if (
    entityType === VariableSchemaEntityType.ENTITY
    && [VariableSchemaType.DEPLOYMENT_VARIABLE, VariableSchemaType.RUN_VARIABLE].includes(type)
  ) {
    return next(new InvalidArgumentError(`Only ${VariableSchemaType.ENVIRONMENT_VARIABLE} can be created for ${VariableSchemaEntityType.ENTITY}`))
  }

  return next()
}
