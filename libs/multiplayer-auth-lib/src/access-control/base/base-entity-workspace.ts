import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import { EntityBase } from './entity-base'
import { getWorkspaceEntityAccessActions } from '../role'

export abstract class EntityBaseWorkspaceLevel extends EntityBase {
  protected async getAccessActions() {
    if (
      this.context.workspaceOwner
      || this.context.workspaceAdmin
      || this.context.superAdmin
    ) {
      return Object.values(RoleAccessAction)
    }

    if (
      this.entityType === RoleWorkspacePermissionEntity.PROJECT
      && this.context.guest
      && !this.context.workspaceRoleId
    ) {
      return [RoleAccessAction.READ]
    }

    if (!this.context.workspaceRoleId) {
      return []
    }

    return getWorkspaceEntityAccessActions(
      this.context.workspaceRoleId,
      this.entityType,
    )
  }
}
