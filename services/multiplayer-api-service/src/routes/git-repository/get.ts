import type { Request, Response, NextFunction } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRepository = req.gitRepository

    return res.status(200).json(gitRepository)
  } catch (err) {
    return next(err)
  }
}
