import type { Request, Response, NextFunction } from 'express'
import { GitRefTagLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lastCommit = req.lastCommit
    const gitRefTagBeforeUpdate = req.gitRefTag
    const gitRefTagId = req.params.gitRefTagId as string
    const projectBranchId = req.params.projectBranchId as string
    const { archived, ...payload } = req.body

    if (archived) {
      payload.archivedAtCommit = lastCommit._id.toString()
    }

    const gitRefTag = await GitRefTagLib.updateGitRefTag({
      gitRefTagId,
      payload,
      projectBranchId,
      gitRefTagBeforeUpdate,
    })
    return res.status(200).json(gitRefTag)
  } catch (err) {
    return next(err)
  }
}

