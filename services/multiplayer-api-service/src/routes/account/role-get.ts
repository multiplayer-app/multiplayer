import type { Request, Response, NextFunction } from 'express'
import { AccessControlRoleUtil } from '@multiplayer/auth'
import { RoleType } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.params.accountId as string
    const accountRoles = AccessControlRoleUtil.roles[RoleType.ACCOUNT]

    if (!accountRoles.length) {
      throw new NotFoundError()
    }

    const filteredRoles = await AccessControlRoleUtil.filterRolePermissionsByAccountLimitations(
      accountRoles,
      accountId,
    )

    const accountRole = filteredRoles[0]

    if (!accountRole) {
      throw new NotFoundError()
    }

    return res.status(200).json(accountRole)
  } catch (err) {
    return next(err)
  }
}
