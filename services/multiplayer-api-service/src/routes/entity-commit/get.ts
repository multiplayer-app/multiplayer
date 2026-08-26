import type { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json(req.entityCommit)
  } catch (err) {
    return next(err)
  }
}
