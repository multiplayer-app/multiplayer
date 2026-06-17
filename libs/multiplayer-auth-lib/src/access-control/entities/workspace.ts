import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  WorkspaceBillingFeatures,
} from '@multiplayer/types'
import { WorkspaceModel, IWorkspaceDocument } from '@multiplayer/models'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'
import * as WorkspaceFeaturesCache from '../../cache/workspace-features.cache'
import {
  getWorkspaceEntityAccessActions,
} from '../role'

export class Workspace extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.WORKSPACE
  }

  protected async getAccessActions() {
    if (!this.context.workspaceRoleId) {
      return []
    }

    if (this.params.workspaceId) {
      return getWorkspaceEntityAccessActions(
        this.context.workspaceRoleId,
        this.entityType,
      )
    }

    return []
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.object().unknown(true),
    })
  }

  getParams(params: any): { _id?: string } {
    const contextParams: {
      _id?: string,
      workspaceId?: string
    } = {}

    if (params.workspaceId) {
      contextParams._id = params.workspaceId
      contextParams.workspaceId = params.workspaceId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return this.context.workspaceId === this.params._id
  }
}

export class WorkspaceMember extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.WORKSPACE_MEMBER
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        workspaceMemberId: Joi.string().hex().length(24),
        workspaceUserId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.object().unknown(true),
    })
  }

  getParams(
    params: any,
    queryParams: any,
    body: any,
  ) {
    const contextParams: {
      _id?: string
      workspaceId: string,
      invitedUserEmails?: string[]
    } = {
      workspaceId: params.workspaceId,
    }

    if (params.workspaceMemberId) {
      contextParams._id = params.workspaceMemberId
    }

    if (params.workspaceUserId) {
      contextParams._id = params.workspaceUserId
    }

    if (body?.emails?.length) {
      contextParams.invitedUserEmails = body.emails
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return this.context.workspaceId === this.params.workspaceId
  }

  // async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
  //   currentCount?: number,
  //   maxCount?: number,
  //   enabled?: boolean,
  //   entity: string,
  // } | false> {
  //   if (
  //     action !== RoleAccessAction.CREATE
  //     || !this.params.invitedUserEmails?.length
  //   ) {
  //     return false
  //   }

  //   const projectFeatures = await WorkspaceFeaturesCache.get(this.params.workspaceId)
  //   const workspaceUsersLimitation = projectFeatures.find(({ name }) => name === WorkspaceBillingFeatures.WORKSPACE_USERS_COUNT)

  //   if (
  //     !workspaceUsersLimitation
  //     || workspaceUsersLimitation.metadata.unlimited
  //   ) {
  //     return false
  //   }

  //   const workspace = await WorkspaceModel.findWorkspaceById(
  //     this.params.workspaceId,
  //     { users: 1 },
  //   ) as IWorkspaceDocument

  //   const usersToInviteCount = this.params.invitedUserEmails.length

  //   if (
  //     workspace?.users.length + usersToInviteCount > (workspaceUsersLimitation?.metadata.count as number)
  //   ) {
  //     return {
  //       currentCount: workspace?.users.length,
  //       maxCount: workspaceUsersLimitation?.metadata.count as number,
  //       entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
  //     }
  //   }

  //   return false
  // }
}
