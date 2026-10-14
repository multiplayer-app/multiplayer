import type { Request, Response, NextFunction } from 'express'
import { CommitModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commitId = req.params.commitId as string
    const payload = req.body

    const commit = await CommitModel.updateCommitById(commitId, payload)

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
