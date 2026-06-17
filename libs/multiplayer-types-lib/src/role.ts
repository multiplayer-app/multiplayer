import {
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleType,
  RoleAccessAction,
  RoleAccountPermissionEntity,
} from './enums'

export interface IRolePermission {
  entity: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity
  access: RoleAccessAction[]
}

export interface IRole {
  _id: string

  default?: boolean

  name: string

  type: RoleType

  workspaceOwner?: boolean
  workspaceAdmin?: boolean
  teamAdmin?: boolean
  readOnly?: boolean

  permissions: IRolePermission[]

  createdAt: string
  updatedAt: string
}
