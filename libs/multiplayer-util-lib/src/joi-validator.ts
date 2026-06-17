import { InvalidArgumentError } from 'restify-errors'
import type { NextFunction, Request } from 'express'
import * as Joi from 'joi'

const defaultOptions = {
  abortEarly: true,
  allowUnknown: false,
  convert: true,
}

export const validate = (
  data: object,
  schema: Joi.Schema,
  options?: Joi.ValidationOptions,
) => {
  const _options = { ...defaultOptions, ...options }

  const { error, value } = schema.validate(data, _options)

  if (error) {
    const errMsg = error.details.map((detail) => detail.message).join('. ')

    throw new InvalidArgumentError(errMsg)
  }

  return value
}

export function validateParams(schema: Joi.Schema) {
  return function(target: any, methodName: string, descriptor) {
    const originalFunction = descriptor.value

    descriptor.value = async function(...args) {
      validate(args, schema)
      return await originalFunction.apply(this, args)
    }

    return descriptor
  }
}

export const validateMiddleware = (
  data: any,
  schema: Joi.Schema,
  options?: Joi.ValidationOptions & { updateQuery?: boolean },
  next?: NextFunction,
  req?: Request,
) => {
  try {
    const { updateQuery, ..._options } = options || {}
    const validatedData = validate(data, schema, _options)

    if (
      updateQuery
      && 'query' in validatedData
      && req
    ) {

      Object.defineProperty(req, 'query', {
        value: validatedData.query,
        writable: true,
        configurable: true,
      })
    }

    if (next) {
      return next()
    }
  } catch (error: any) {
    if (next) {
      next(new InvalidArgumentError(error.message))
    } else {
      throw new InvalidArgumentError(error.message)
    }
  }
}

export const isValidId = (id: string | undefined) => {
  const idSchema = Joi.string().hex().length(24).required()
  const { error } = idSchema.validate(id)
  return !error
}
