import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AgentSchema } from './schema'

export const validateListAgents = (
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
    AgentSchema.listAgentsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetAgent = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AgentSchema.getAgentSchema,
    { updateQuery: true },
    next,
    req,
  )
}
