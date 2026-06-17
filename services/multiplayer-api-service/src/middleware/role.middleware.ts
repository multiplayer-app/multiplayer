import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { RoleType } from '@multiplayer/types'
import { RoleModel } from '@multiplayer/models'

const deepGet = (obj, keys) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)

export const validateRoleTypeIs = ({
  type,
  propertyPath,
}: { type: RoleType, propertyPath: string, }) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const _propertyPath = propertyPath.split(',')
    const roleId = deepGet(req.body, _propertyPath)

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
