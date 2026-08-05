import type { Request, Response, NextFunction } from 'express'
import { CommitLib } from '../lib'
import { NotFoundError } from 'restify-errors'

export const attachCommit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commitId = req.params.commitId as string

    const commit = await CommitLib.getCommitById(commitId)

    req.commit = commit

    next()
  } catch (err) {
    next(err)
  }
}

export const attachLastCommit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranch = req.projectBranch

    const lastCommit = await CommitLib.getLastCommit(projectBranch._id)

    if (!lastCommit) throw new NotFoundError(`lastCommit was not found for branch ${projectBranch._id}!`)
    req.lastCommit = lastCommit

    next()
  } catch (err) {
    next(err)
  }
}
