import type { Request, Response, NextFunction } from 'express'
import { ProjectModel, RoleModel } from '@multiplayer/models'
import { IAccess, RoleType } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const access = req.body as IAccess || {}

    // temporary set only read only role
    const readOnlyRole = await RoleModel.findReadOnlyRole(RoleType.PROJECT)
    if (!readOnlyRole) {
      throw new NotFoundError('READ_ONLY_ROLE_NOT_FOUND')
    }
    access.guest = {
      ...(access.guest || {}),
      role: readOnlyRole._id.toString(),
    }

    const updatedAccess = await ProjectModel.updateProjectAccess(projectId, access)

    await AccessControlContext.invalidateContext({
      workspaceId,
    })

    return res.status(200).json(updatedAccess)
  } catch (err) {
    return next(err)
  }
}
