import type { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = {
      access: req.access.permissions,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
