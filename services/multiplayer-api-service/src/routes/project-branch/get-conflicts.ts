import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel, EntityModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string
    const {
      projectBranchFrom: projectBranchFromId,
      projectBranchTo: projectBranchToId,
    } = req.query

    const conflicts = await EntityCommitModel.getConflicts(
      projectBranchFromId as string,
      projectBranchToId as string,
      { sortKey, sortDirection },
    )

    const aliasConflicts = await EntityModel.getConflicts(
      projectBranchFromId as string,
      projectBranchToId as string)

    return res.status(200).json({
      commits: conflicts,
      aliases: aliasConflicts,
    })
  } catch (err) {
    return next(err)
  }
}
