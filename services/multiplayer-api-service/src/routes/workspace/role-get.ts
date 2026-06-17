import type { Request, Response, NextFunction } from 'express'
import { AccessControlRoleUtil } from '@multiplayer/auth'
import { ForbiddenError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceRoleId = req.context.workspaceRoleId

    if (!workspaceRoleId) {
      throw new ForbiddenError()
    }

    const role = AccessControlRoleUtil.getWorkspaceRole(workspaceRoleId)

    return res.status(200).json(role)
  } catch (err) {
    return next(err)
  }
}
