import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  GitRefTagModel,
  ProjectBranchModel,
} from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'

export const attachGitRefTag = async (req: Request, res: Response, next: NextFunction) => {
  const gitRefTagId = req.params.gitRefTagId as string
  const projectBranchId = req.params.projectBranchId as string

  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  const gitRefTag = await GitRefTagModel.findGitRefTagById(
    gitRefTagId,
    projectBranches.map(({ _id }) => _id),
  )

  if (!gitRefTag) {
    return next(new NotFoundError(ErrorMessage.TAG_NOT_FOUND))
  }

  req.gitRefTag = gitRefTag

  next()
}
