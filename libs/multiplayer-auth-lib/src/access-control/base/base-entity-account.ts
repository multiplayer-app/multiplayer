import {
  RoleType,
  RoleAccessAction,
} from '@multiplayer/types'
import { EntityBase } from './entity-base'
import { roles, getAccountEntityAccessActions } from '../role'

export abstract class EntityBaseAccountLevel extends EntityBase {
  protected async getAccessActions() {
    if (this.context.superAdmin) {
      return Object.values(RoleAccessAction)
    }

    const accountAdminRole = roles[RoleType.ACCOUNT][0]

    if (!accountAdminRole) {
      return []
    }

    return getAccountEntityAccessActions(
      this.params.accountId,
      accountAdminRole._id.toString(),
      this.entityType,
    )
  }
}
