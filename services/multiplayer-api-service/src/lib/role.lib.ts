import { NotFoundError } from 'restify-errors'
import {
  IRoleDocument,
  RoleModel,
} from '@multiplayer/models'
import { RoleType } from '@multiplayer/types'
import { Types } from 'mongoose'

export const fetchRoleById = async (
  roleId: Types.ObjectId | string,
  roleType: RoleType,
): Promise<IRoleDocument> => {
  const role = await RoleModel.findRoleById(roleId, roleType)

  if (!role) {
    throw new NotFoundError(`${roleType} role not found`)
  }

  return role
}

export const fetchDefaultRole = async (
  roleType: RoleType,
): Promise<IRoleDocument> => {
  const role = await RoleModel.findDefaultRole(roleType)

  if (!role) {
    throw new NotFoundError(`Default ${roleType} role not found`)
  }

  return role
}

export const fetchWorkspaceOwnerRole = async (): Promise<IRoleDocument> => {
  const role = await RoleModel.findWorkspaceOwnerRole()

  if (!role) {
    throw new NotFoundError('Workspace owner role not found')
  }

  return role
}
