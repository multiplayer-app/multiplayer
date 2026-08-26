import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { BranchReviewSchema } from './schema'

export const validateAddBranchReview = (req: Request, res: Response, next: NextFunction) => {

  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    BranchReviewSchema.addBranchReviewSchema,
    {},
    next,
  )
}

export const validateListBranchReviews = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    BranchReviewSchema.listBranchReviewsSchema,
    {},
    next,
  )
}

export const validateUpdateReview = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    BranchReviewSchema.updateBranchReviewSchema,
    {},
    next,
  )
}

export const validateInviteBranchReviewer = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    BranchReviewSchema.inviteBranchReviewerSchema,
    {},
    next,
  )
}

export const validateRemoveBranchReviewer = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    BranchReviewSchema.removeBranchReviewerSchema,
    {},
    next,
  )
}
