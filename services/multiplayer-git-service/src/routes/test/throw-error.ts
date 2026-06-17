import type { NextFunction, Request, Response } from 'express'
import { InvalidArgumentError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.query

    throw new InvalidArgumentError(message || 'This is a test error')

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
