import type { ObjectId } from '@multiplayer/mongo'
import { ObjectTypeEnum, RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'

export interface Context {
  integrationId?: string
  userId?: string
  guest?: boolean
  workspaceUserId?: string
  workspaceId: string
  workspaceOwner?: boolean
  workspaceAdmin?: boolean
  superAdmin?: boolean
  workspaceRoleId?: string
  teams: {
    teamId: string
    projects: string[]
    projectRoleId: string
  }[]
  projects: {
    projectId: string
    projectRoleIds: string[]
  }[]
  objects: {
    objectId: string
    objectType: ObjectTypeEnum
    publicShareRoleIds: string[]
  }[]
  scopes?: Partial<Record<RoleProjectPermissionEntity, RoleAccessAction[]>>
}
