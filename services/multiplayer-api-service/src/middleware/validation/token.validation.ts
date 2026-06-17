import { JoiValidator } from '@multiplayer/util'
import { NextFunction, Request, Response } from 'express'
import { TokenSchema } from './schema'

export const validateApplyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    TokenSchema.applyTokenSchema,
    {},
    next,
  )
}

export const validateGetToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TokenSchema.getTokenSchema,
    {},
    next,
  )
}

