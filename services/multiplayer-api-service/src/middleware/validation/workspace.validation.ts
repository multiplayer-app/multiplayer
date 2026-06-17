import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { WorkspaceModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { WorkspaceSchema } from './schema'
// import { AI_REQUEST_LIMIT } from '../../config'

export const validateListWorkspaces = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.listWorkspaceSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetWorkspace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.getWorkspaceSchema,
    {},
    next,
  )
}

export const validateCheckFeatureFlag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.checkFeatureFlagSchema,
    {},
    next,
  )
}

export const validateUpdateFeatureFlag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.updateFeatureFlagSchema,
    {},
    next,
  )
}

export const validateCreateWorkspace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.createWorkspaceSchema,
    {},
    next,
  )
}

export const validateUpdateWorkspace = (
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
    WorkspaceSchema.updateWorkspaceSchema,
    {},
    next,
  )
}

export const validateUpdateWorkspaceIcon = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.updateWorkspaceIconSchema,
    {},
    next,
  )
}

export const validateDeleteWorkspace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.deleteWorkspaceSchema,
    {},
    next,
  )
}

export const validateAddWorkspaceDomain = (
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
    WorkspaceSchema.addWorkspaceDomainSchema,
    {},
    next,
  )
}

export const validateConfirmWorkspaceDomain = (
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
    WorkspaceSchema.confirmWorkspaceDomainSchema,
    {},
    next,
  )
}

export const validateRemovemWorkspaceDomain = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.removeWorkspaceDomainSchema,
    {},
    next,
  )
}

export const validateCanMakeAiRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const workspaceId = req.query.workspace as string

    const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

    if (!workspace) {
      return next(new NotFoundError('Workspace not found'))
    }

    req.workspace = workspace

    // if (req.workspace.billing.aiRequests >= AI_REQUEST_LIMIT) {
    //   throw new RequestThrottledError('Reached AI requests limit.')
    // }

    next()
  } catch (err) {
    next(err)
  }
}

export const validateGetWorkspaceBillingAccount = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.getWorkspaceBillingAccountSchema,
    {},
    next,
  )
}

export const validateGetWorkspaceBillingInfo = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.getWorkspaceBillingInfoSchema,
    {},
    next,
  )
}

export const validateListWorkspaceRoles = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.listWorkspaceRolesSchema,
    {},
    next,
  )
}

export const validateGetWorkspaceRole = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceSchema.getWorkspaceRoleSchema,
    {},
    next,
  )
}

export const validateUpdateWorkspaceAccess = (
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
    WorkspaceSchema.updateWorkspaceAccessSchema,
    {},
    next,
  )
}

export const validateGetWorkspaceAccessPermissions = (
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
    WorkspaceSchema.getWorkspaceAccessPermissionsSchema,
    {},
    next,
  )
}
