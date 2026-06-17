import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AgentSessionSchema } from './schema'

export const validateListAgentSessions = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, query: req.query },
    AgentSessionSchema.listAgentSessionsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreateAgentSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentSessionSchema.createAgentSessionSchema,
    {},
    next,
    req,
  )
}
