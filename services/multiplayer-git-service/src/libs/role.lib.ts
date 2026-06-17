import { NotFoundError } from 'restify-errors'
import {
  IRoleDocument,
  RoleModel,
} from '@multiplayer/models'
import { RoleType } from '@multiplayer/types'
import { Types } from 'mongoose'

export const fetchRoleById = async (
  roleId: Types.ObjectId | string,
): Promise<IRoleDocument> => {
  const role = await RoleModel.findRoleById(roleId)

  if (!role) {
    throw new NotFoundError('Role not found')
  }

  return role
}
