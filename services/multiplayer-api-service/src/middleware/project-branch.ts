import type { Request, Response, NextFunction } from 'express'
import {
  ProjectBranchModel,
  IProjectBranchDocument,
  EntityCommitModel,
} from '@multiplayer/models'
import { ErrorMessage, ProjectBranchStatus } from '@multiplayer/types'
import {
  NotFoundError,
  InvalidArgumentError,
  PreconditionFailedError,
  ForbiddenError,
} from 'restify-errors'

export const attachProjectBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string

    const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)

    if (!projectBranch || !projectBranch.project.equals(projectId)) {
      return next(new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND))
    }

    req.projectBranch = projectBranch

    next()
  } catch (err) {
    next(err)
  }
}

export const attachProjectBranchTree = async (req: Request, res: Response, next: NextFunction) => {
  const projectBranchId = req.params.projectBranchId as string

  const projectBranchTree = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

  if (!projectBranchTree.length) {
    return next(new NotFoundError(ErrorMessage.NO_BRANCH_TREE))
  }

  req.projectBranchTree = projectBranchTree

  next()
}

export const validateCanDoChangesInBranch = async (req: Request, res: Response, next: NextFunction) => {
  const projectBranch = req.projectBranch

  if (projectBranch.status === ProjectBranchStatus.MERGED) {
    return next(new ForbiddenError(ErrorMessage.UNAVAILABLE_FOR_MERGE_BRANCH))
  }

  next()
}

export const validateCanMerge = async (req: Request, res: Response, next: NextFunction) => {
  const {
    projectBranchFrom: projectBranchFromId,
    projectBranchTo: projectBranchToId,
  } = req.body

  req.projectBranchFrom = await ProjectBranchModel.findProjectBranchById(projectBranchFromId as string) as IProjectBranchDocument
  req.projectBranchTo = await ProjectBranchModel.findProjectBranchById(projectBranchToId as string) as IProjectBranchDocument

  if (!req.projectBranchTo) {
    return next(new NotFoundError(ErrorMessage.DESTINATION_BRANCH_NOT_FOUND))
  }

  if (!req.projectBranchFrom) {
    return next(new NotFoundError(ErrorMessage.SOURCE_BRANCH_NOT_FOUND))
  }

  if (!req.projectBranchFrom?.default && !req.projectBranchTo?.default) {
    return next(new InvalidArgumentError(ErrorMessage.MERGE_DEFAULT_BRANCH_ONLY))
  }

  if (req.projectBranchFrom?._id.equals(req.projectBranchTo?._id)) {
    return next(new InvalidArgumentError(ErrorMessage.MERGE_SAME_BRANCH_NOT_ALLOWED))
  }

  if (!req.projectBranchFrom.project.equals(req.projectBranchTo.project)) {
    return next(new ForbiddenError(ErrorMessage.USE_BRANCHES_FROM_THE_SAME_PROJECT))
  }

  const conflictEntityCommits = await EntityCommitModel.getConflicts(
    projectBranchFromId as string,
    projectBranchToId as string,
  )

  if (req.projectBranchTo.default && conflictEntityCommits.length) {
    return next(new PreconditionFailedError(ErrorMessage.RESOLVE_CONFLICTS))
  }

  next()
}
