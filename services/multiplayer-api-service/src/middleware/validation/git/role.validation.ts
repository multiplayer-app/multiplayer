import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { RoleType } from '@multiplayer/types'
import { RoleModel } from '@multiplayer/models'

export const validateRoleTypeIs = ({
  type,
  propertyName,
}: { type: RoleType, propertyName: string, }) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roleId = req.body[propertyName]
    if (roleId) {
      const role = await RoleModel.findRoleById(roleId, type)

      if (!role) {
        throw new InvalidArgumentError('INVALID_ROLE_TYPE')
      }
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
