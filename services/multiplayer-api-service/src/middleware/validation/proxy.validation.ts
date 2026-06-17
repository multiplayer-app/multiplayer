import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ProxySchema } from './schema'

export const validateProxyRequest = (
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
    ProxySchema.proxyRequestSchema,
    {},
    next,
  )
}
