import type { Request, Response, NextFunction } from 'express'
import { RoleModel } from '@multiplayer/models'
import { AccessControlRoleUtil } from '@multiplayer/auth'
import { RoleType } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.accountId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: any = {
      type: RoleType.ACCOUNT,
    }

    const roles = await RoleModel.findRoles(
      filter,
      {
        skip,
        limit,
      },
    )

    roles.data = await AccessControlRoleUtil.filterRolePermissionsByAccountLimitations(
      roles.data,
      accountId as string,
    )

    return res.status(200).json(roles)
  } catch (err) {
    return next(err)
  }
}
