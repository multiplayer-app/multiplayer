import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { StripeSchema } from './schema'

export const validateListStripePlans = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    StripeSchema.listStripePlansSchema,
    { updateQuery: true },
    next,
    req,
  )
}

// export const validateGetTeam = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const args = {
//     params: req.params,
//   }

//   JoiValidator.validateMiddleware(
//     args,
//     TeamSchema.getTeamSchema,
//     {},
//     next,
//   )
// }
