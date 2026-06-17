import { ForbiddenError } from 'restify-errors'
import { RoleAccessAction } from '@multiplayer/types'
import { EntityBase } from './entity-base'
import {
  getProjectAggregatedEntityAccessActions,
  getProjectPublicShareAggregatedEntityAccessActions,
} from '../role'

export abstract class EntityBaseProjectLevel extends EntityBase {
  protected async getAccessActions() {
    // this is handling of case when workspace admin deleted all teams
    if (
      this.context.workspaceOwner
      || this.context.workspaceAdmin
      || this.context.superAdmin
    ) {
      return Object.values(RoleAccessAction)
    }

    const project = this.context.projects
      .find(({ projectId: _projectId }) => _projectId === this.params.projectId)

    if (!project) {
      throw new ForbiddenError('No access to project')
    }

    if (this.context?.scopes) {
      return this.context?.scopes[this.entityType] || []
    }

    if (this.context?.objects?.length) {
      return getProjectPublicShareAggregatedEntityAccessActions(
        project.projectRoleIds,
        this.entityType,
      )
    }

    return getProjectAggregatedEntityAccessActions(
      project.projectRoleIds,
      this.entityType,
    )
  }
}
