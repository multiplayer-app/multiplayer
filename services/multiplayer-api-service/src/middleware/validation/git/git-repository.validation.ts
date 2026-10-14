import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositorySchema } from './schema'

export const validateListGitRepositoriesInProject = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.listGitRepositoriesInProjectSchema,
    {},
    next,
  )
}

export const validateListGitRepositoriesInWorkspace = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.listGitRepositoriesInWorkspaceSchema,
    {},
    next,
  )
}

export const validateGetGitRepository = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.getGitRepositorySchema,
    {},
    next,
  )
}

export const validateCreateGitRepository = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.createGitRepositorySchema,
    {},
    next,
  )
}

export const validateBulkUpdateGitRepository = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.bulkUpdateGitRepositorySchema,
    {},
    next,
  )
}

export const validateUpdateGitRepository = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.updateGitRepositorySchema,
    {},
    next,
  )
}

export const validateDeleteGitRepository = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.deleteGitRepositorySchema,
    {},
    next,
  )
}

export const validateGetGitRepositoryByGitId = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositorySchema.getGitRepositoryByGitIdSchema,
    {},
    next,
  )
}
