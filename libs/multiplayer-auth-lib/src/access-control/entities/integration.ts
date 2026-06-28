import type { Request } from 'express'
import {
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleAccessAction,
  IntegrationTypeEnum,
  ErrorMessage,
  RoleType,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { IntegrationModel } from '@multiplayer/models'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'
import { ForbiddenError } from 'restify-errors'
import {
  roles,
  getWorkspaceEntityAccessActions,
  getProjectAggregatedEntityAccessActions,
} from '../role'

export class Integration extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.INTEGRATION
  }

  protected async getAccessActions() {
    if (
      this.context.workspaceOwner
      || this.context.workspaceAdmin
      || this.context.superAdmin
    ) {
      return Object.values(RoleAccessAction)
    }

    let workspaceActions: RoleAccessAction[] = []
    if (this.context.workspaceRoleId) {
      try {
        workspaceActions = await getWorkspaceEntityAccessActions(
          this.context.workspaceRoleId,
          RoleWorkspacePermissionEntity.INTEGRATION,
        )
      } catch {
        // workspace role has no integration permissions — fall through to project check
      }
    }

    if (this.params.projectId) {
      const project = this.context.projects
        .find(({ projectId }) => projectId === this.params.projectId)

      if (project) {
        const projectActions = await getProjectAggregatedEntityAccessActions(
          project.projectRoleIds,
          RoleProjectPermissionEntity.INTEGRATION,
        )

        return [...new Set([
          ...workspaceActions,
          ...projectActions,
        ])]
      }
    }

    return workspaceActions
  }

  protected getValidationSchema(): Joi.Schema<any> {
    return Joi.alternatives(
      Joi.object({
        queryParams: Joi.object({
          project: Joi.string().hex().length(24),
        }).unknown(),
        params: Joi.object({
          workspaceId: Joi.string().hex().length(24).required(),
        }).unknown().required(),
        body: Joi.object({
          workspaceRole: Joi.string().hex().length(24),
          projectRole: Joi.string().hex().length(24),
          project: Joi.string().hex().length(24),
        }).unknown(),
      }),
      Joi.object({
        queryParams: Joi.object(),
        params: Joi.object({
          workspaceId: Joi.string().hex().length(24).required(),
          integrationId: Joi.string().hex().length(24),
        }).unknown().required(),
        body: Joi.object({
          workspaceRole: Joi.string().hex().length(24),
          projectRole: Joi.string().hex().length(24),
          project: Joi.string().hex().length(24),
        }).unknown(),
      }),
      Joi.object({
        queryParams: Joi.object({
          workspace: Joi.string().hex().length(24).required(),
        }).unknown().required(),
        params: Joi.object({
          integrationId: Joi.string().hex().length(24),
        }).unknown().required(),
        body: Joi.any(),
      }),
      Joi.object({
        queryParams: Joi.object({
          state: Joi.string().required(),
        }).unknown().required(),
        params: Joi.object({
          integrationId: Joi.string().hex().length(24),
        }).unknown().required(),
        body: Joi.any(),
      }),
    )
  }

  getParams(
    params: any,
    queryParams: any,
    body: any,
    req: Request,
  ) {
    const type = body?.type

    const contextParams: {
      _id?: string,
      workspaceId: string,
      projectId?: string,
      type?: IntegrationTypeEnum,
      workspaceRole?: string,
      projectRole?: string
    } = {
      workspaceId: params.workspaceId
        || queryParams.workspace
        || req?.session?.[req?.oauthStateSessionPath || '']?.state?.state?.workspace,
    }

    if (type) {
      contextParams.type = type
    }

    if (body?.project) {
      contextParams.projectId = body.project
    }
    if (body?.workspaceRole) {
      contextParams.workspaceRole = body.workspaceRole
    }
    if (body?.projectRole) {
      contextParams.projectRole = body.projectRole
    }
    if (queryParams?.project) {
      contextParams.projectId = queryParams.project
    }

    if (params.integrationId) {
      contextParams._id = params.integrationId
    } else if (req.overrideIdPath) {
      const path = req.overrideIdPath.split('.')
      const value = path.reduce((acc, curr) => acc[curr], req as any)
      contextParams._id = value as unknown as string
    }

    return contextParams
  }

  async ability(action: RoleAccessAction): Promise<boolean> {
    const allowed = await super.ability(action)

    if (
      allowed
      && [RoleAccessAction.CREATE, RoleAccessAction.UPDATE].includes(action)
    ) {
      if (this.params.workspaceRole) {
        this.assertWorkspaceRoleNotEscalated(this.params.workspaceRole)
      }
      if (this.params.projectRole) {
        this.assertProjectRoleNotEscalated(this.params.projectRole)
      }
    }

    return allowed
  }

  private assertWorkspaceRoleNotEscalated(roleId: string): void {
    if (this.context.superAdmin || this.context.workspaceOwner || this.context.workspaceAdmin) return

    const targetRole = roles[RoleType.WORKSPACE].find(r => r._id.toString() === roleId)
    if (!targetRole) {
      logger.warn(`[ACCESS_CONTROL_INTEGRATION] Workspace role not found: ${roleId}`)
      throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
    }

    const callerRole = this.context.workspaceRoleId
      ? roles[RoleType.WORKSPACE].find(r => r._id.toString() === this.context.workspaceRoleId)
      : undefined

    const callerPermissionMap = new Map<string, Set<RoleAccessAction>>(
      (callerRole?.permissions ?? []).map(p => [p.entity, new Set(p.access)]),
    )

    for (const { entity, access } of targetRole.permissions) {
      const callerActions = callerPermissionMap.get(entity)
      for (const action of access) {
        if (!callerActions?.has(action)) {
          logger.warn(`[ACCESS_CONTROL_INTEGRATION] Attempted to assign workspace role with elevated permission ${entity}:${action}`)
          throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
        }
      }
    }
  }

  private assertProjectRoleNotEscalated(roleId: string): void {
    if (this.context.superAdmin || this.context.workspaceOwner || this.context.workspaceAdmin) return

    const targetRole = roles[RoleType.PROJECT].find(r => r._id.toString() === roleId)
    if (!targetRole) {
      logger.warn(`[ACCESS_CONTROL_INTEGRATION] Project role not found: ${roleId}`)
      throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
    }

    const projectId = this.params.projectId
    const callerProjectRoleIds = projectId
      ? (this.context.projects.find(p => p.projectId === projectId)?.projectRoleIds ?? [])
      : this.context.projects.flatMap(p => p.projectRoleIds)

    const callerProjectRoles = roles[RoleType.PROJECT]
      .filter(r => callerProjectRoleIds.includes(r._id.toString()))

    const callerPermissionMap = new Map<string, Set<RoleAccessAction>>()
    for (const role of callerProjectRoles) {
      for (const { entity, access } of role.permissions) {
        if (!callerPermissionMap.has(entity)) {
          callerPermissionMap.set(entity, new Set())
        }
        for (const action of access) {
          callerPermissionMap.get(entity)!.add(action)
        }
      }
    }

    for (const { entity, access } of targetRole.permissions) {
      const callerActions = callerPermissionMap.get(entity)
      for (const action of access) {
        if (!callerActions?.has(action)) {
          logger.warn(`[ACCESS_CONTROL_INTEGRATION] Attempted to assign project role with elevated permission ${entity}:${action}`)
          throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
        }
      }
    }
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const integration = await IntegrationModel.findIntegrationByIdInWorkspace(
      this.params._id,
      this.params.workspaceId,
    )

    return !!integration
  }

  // async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
  //   currentCount?: number,
  //   maxCount?: number,
  //   enabled?: boolean,
  //   entity: string,
  // } | false> {
  //   if (
  //     action !== RoleAccessAction.CREATE
  //     || ![
  //       IntegrationTypeEnum.OTEL,
  //     ].includes(this.params.type)
  //   ) {
  //     return false
  //   }

  //   const workspaceFeatures = await WorkspaceFeaturesCache.get(this.params.workspaceId)

  //   const otelIntegrationFeature = workspaceFeatures.find(({ name }) => name === WorkspaceBillingFeatures.WORKSPACE_INTEGRATIONS_OTEL)

  //   if (otelIntegrationFeature?.metadata?.enabled) {
  //     return false
  //   }

  //   return {
  //     enabled: !!otelIntegrationFeature?.metadata?.enabled,
  //     entity: RoleWorkspacePermissionEntity.INTEGRATION,
  //   }
  // }
}
