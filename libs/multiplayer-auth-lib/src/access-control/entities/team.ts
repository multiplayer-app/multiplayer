import { InvalidArgumentError } from 'restify-errors'
import { RoleWorkspacePermissionEntity } from '@multiplayer/types'
import { TeamModel } from '@multiplayer/models'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'
import {
  getProjectAggregatedEntityAccessActions,
  getWorkspaceEntityAccessActions,
} from '../role'

export class Team extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.TEAM
  }

  protected async getAccessActions() {
    if (!this.context.workspaceRoleId) {
      return []
    }

    const workspaceLevelActions = await getWorkspaceEntityAccessActions(
      this.context.workspaceRoleId,
      this.entityType,
    )

    const teamContext = this.context.teams.find(
      ({ teamId }) => teamId === this.params._id)
    if (!teamContext) {
      return workspaceLevelActions
    }
    const teamActions = await getProjectAggregatedEntityAccessActions(
      [teamContext.projectRoleId],
      this.entityType,
    )

    return [...new Set([...workspaceLevelActions, ...teamActions])]
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        teamId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }
  getParams(params: any):{
    _id?: string,
    workspaceId: string
  } {
    const contextParams: {
      _id?: string,
      workspaceId: string
    } = {
      workspaceId: params.workspaceId,
    }

    if (params.teamId) {
      contextParams._id = params.teamId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const team = await TeamModel.findTeamByIdAndWorkspace(
      this.params._id,
      this.params.workspaceId,
    )

    if (!team) {
      return false
    }

    if (this.context.workspaceOwner || this.context.workspaceAdmin) {
      return true
    }

    return !!this.context.teams
      .find((team) => team.teamId === this.params._id)
  }
}

export class TeamMember extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.TEAM_MEMBER
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        teamId: Joi.string().hex().length(24).required(),
        teamUserId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any): {
    workspaceId: string,
    teamId: string,
    _id?: string
  } {
    if (!params.teamId) {
      throw new InvalidArgumentError('Invalid context params')
    }

    const contextParams: {
      workspaceId: string,
      teamId: string,
      _id?: string
    } = {
      workspaceId: params.workspaceId,
      teamId: params.teamId,
    }

    if (params.teamUserId) {
      contextParams._id = params.teamUserId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const [teamMember] = await TeamModel.getTeamMembersByTeamMemberIds(
      this.params.teamId,
      [this.params._id],
    )

    if (!teamMember) {
      return false
    }

    if (this.context.workspaceOwner) {
      return true
    }

    return !!this.context.teams
      .find((team) => team.teamId === this.params._id)
  }
}
