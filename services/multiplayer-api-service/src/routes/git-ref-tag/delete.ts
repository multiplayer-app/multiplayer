import type { Request, Response, NextFunction } from 'express'
import { GitRefTagLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRefTagId = req.params.gitRefTagId as string
    const projectBranchId = req.params.projectBranchId as string

    await GitRefTagLib.deleteGitRefTag(
      projectBranchId,
      {
        gitRefTagId,
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
