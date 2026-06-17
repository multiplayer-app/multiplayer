import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  WorkspaceBillingFeatures,
} from '@multiplayer/types'
import { InvalidArgumentError } from 'restify-errors'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'
import { ProjectModel } from '@multiplayer/models'
import * as WorkspaceFeaturesCache from '../../cache/workspace-features.cache'

export class Project extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.PROJECT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.object().unknown(true),
    })
  }

  getParams(params: any): {
    _id?: string,
    workspaceId: string
  } {
    const contextParams: {
      _id?: string,
      workspaceId: string
    } = {
      workspaceId: params.workspaceId,
    }

    if (params.projectId) {
      contextParams._id = params.projectId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return !!this.context.projects.find((project) =>
      project.projectId === this.params._id,
    )
  }

  // async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
  //   currentCount?: number,
  //   maxCount?: number,
  //   enabled?: boolean,
  //   entity: string,
  // } | false> {
  //   if (action !== RoleAccessAction.CREATE) {
  //     return false
  //   }

  //   const projectFeatures = await WorkspaceFeaturesCache.get(this.params.workspaceId)
  //   const integrationFeature = projectFeatures.find(({ name }) => name === WorkspaceBillingFeatures.WORKSPACE_PROJECTS_COUNT)

  //   if (
  //     !integrationFeature
  //     || integrationFeature.metadata.unlimited
  //   ) {
  //     return false
  //   }

  //   const projectsCount = await ProjectModel.countProjectsInWorkspace(this.params.workspaceId)

  //   if (projectsCount >= (integrationFeature?.metadata?.count as number)) {
  //     return {
  //       currentCount: projectsCount,
  //       maxCount: integrationFeature?.metadata?.count as number,
  //       entity: RoleWorkspacePermissionEntity.PROJECT,
  //     }
  //   }

  //   return false
  // }
}

export class ProjectMember extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.PROJECT_MEMBER
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        projectUserId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any): {
    workspaceId: string,
    projectId: string,
    _id?: string
  } {
    if (!params.projectId) {
      throw new InvalidArgumentError('Invalid context params')
    }

    const contextParams: {
      workspaceId: string,
      projectId: string,
      _id?: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.projectUserId) {
      contextParams._id = params.projectUserId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const [projectMember] = await ProjectModel.getProjectUsersByProjectUserIds(
      this.params.projectId,
      [this.params._id],
    )

    if (!projectMember) {
      return false
    }

    if (this.context.workspaceOwner || this.context.workspaceAdmin) {
      return true
    }

    return !!this.context.projects
      .find((project) => project.projectId === this.params.projectId)
  }
}
