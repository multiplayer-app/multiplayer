import type { Request, Response, NextFunction } from 'express'
import { RoleModel } from '@multiplayer/models'
// import { AccessControlRoleUtil } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query
    // const { workspaceId } = req.params
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: any = { type }

    const roles = await RoleModel.findRoles(
      filter,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(roles)
  } catch (err) {
    return next(err)
  }
}
