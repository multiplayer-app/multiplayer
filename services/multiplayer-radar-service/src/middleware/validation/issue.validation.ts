import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { IssueSchema } from './schema'

export const validateListIssues = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listIssuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListGroupedIssues = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listGroupedIssuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetIssueByComponentHash = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.getIssueByComponentHashSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetIssueByTitleHash = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.getIssueByTitleHashSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetIssue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.getIssueSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateIssue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.updateIssueSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveIssue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.removeIssueSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkUpdateIssues = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.bulkUpdateIssuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateBulkRemoveIssues = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.bulkRemoveIssuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListIssuesForEndUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listIssuesForEndUserSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListSimilarIssues = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listSimilarIssuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListAffectedEndUsers = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listAffectedEndUsersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateListAffectedEndUsersByTitleHash = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IssueSchema.listAffectedEndUsersByTitleHashSchema,
    { updateQuery: true },
    next,
    req,
  )
}
