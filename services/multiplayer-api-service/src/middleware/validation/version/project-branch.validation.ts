import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ProjectBranchSchema } from './schema'

export const validateListBranches = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.listProjectBranchSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetDefaultBranch = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getDefaultProjectProjectBranchSchema,
    {},
    next,
  )
}

export const validateGetBranch = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getProjectBranchSchema,
    {},
    next,
  )
}

export const validateCreateBranch = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.createProjectProjectBranchSchema,
    {},
    next,
  )
}

export const validateUpdateBranch = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.updateProjectBranchSchema,
    {},
    next,
  )
}

export const validateDeleteBranch = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.deleteProjectBranchSchema,
    {},
    next,
  )
}

export const validateMergeBranches = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.mergeBranchesSchema,
    {},
    next,
  )
}

export const validateGetBranchConflicts = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getBranchConflictsSchema,
    {},
    next,
  )
}

export const validateGetBranchChanges = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(args, ProjectBranchSchema.getBranchChangesSchema, {}, next)
}

export const validateGetBranchChangesStats = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getBranchChangesStatsSchema,
    {},
    next,
  )
}

export const validateGetBranchStateArgs = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getProjectBranchStateSchema,
    {},
    next,
  )
}
export const validateCommitBranchArgs = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.commitBranchArgsSchema,
    {},
    next,
  )
}
export const validateUpdateDefaultGitRepositoryBranchName = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.updateDefaultGitRepositoryBranchName,
    {},
    next,
  )
}
