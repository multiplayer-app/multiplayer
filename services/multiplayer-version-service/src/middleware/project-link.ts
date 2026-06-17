import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import {
  ProjectLinkModel,
  ProjectBranchModel,
} from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'

export const attachProjectLink = async (req: Request, res: Response, next: NextFunction) => {
  const projectLinkId = req.params.projectLinkId as string
  const projectBranchId = req.params.projectBranchId as string

  const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
  const projectLink = await ProjectLinkModel.findProjectLinkById(
    projectLinkId,
    projectBranches.map(({ _id }) => _id),
  )

  if (!projectLink) {
    return next(new NotFoundError(ErrorMessage.LINK_NOT_FOUND))
  }

  req.projectLink = projectLink

  next()
}
