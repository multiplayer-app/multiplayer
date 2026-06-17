import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
  WorkspaceBillingFeatures,
  EntityType,
  ErrorMessage,
} from '@multiplayer/types'
import {
  EntityModel,
  ProjectBranchModel,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'
import * as WorkspaceFeaturesCache from '../../cache/workspace-features.cache'

export class Entity extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.ENTITY
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        entityId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.alternatives(
        Joi.object().unknown(true),
        Joi.array().items(Joi.object().unknown(true)),
      ),
    })
  }

  getParams(
    params: any,
    queryParams: any,
    body: any,
  ) {
    let type = body.type

    if (!type) {
      if (body?.name && Array.isArray(body?.components)) {
        type = EntityType.PLATFORM
      } else if (body?.length) {
        type = body?.map(({ type }) => type)
      }
    }


    const contextParams: {
      _id?: string,
      workspaceId: string,
      projectId: string,

      type?: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,

      type,
    }

    if (params.entityId) {
      contextParams._id = params.entityId
    }
    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const entity = await EntityModel.findEntityInProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!entity
  }

  // async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
  //   currentCount?: number,
  //   maxCount?: number,
  //   enabled?: boolean,
  //   entity: string,
  // } | false> {
  //   if (
  //     action !== RoleAccessAction.CREATE
  //     || this.params.type !== EntityType.PLATFORM
  //   ) {
  //     return false
  //   }

  //   const workspaceFeatures = await WorkspaceFeaturesCache.get(this.params.workspaceId)

  //   const platformLimitation = workspaceFeatures.find(({ name }) => name === WorkspaceBillingFeatures.WORKSPACE_PLATFORMS_COUNT)

  //   if (
  //     !platformLimitation
  //     || platformLimitation.metadata.unlimited
  //   ) {
  //     return false
  //   }

  //   const defaultBranch = await ProjectBranchModel.getDefaultProjectBranch(this.params.projectId)

  //   if (!defaultBranch) {
  //     throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
  //   }

  //   const platformsCount = await EntityModel.countEntitiesInBranch({
  //     workspaceId: this.params.workspaceId,
  //     projectId: this.params.projectId,
  //     projectBranchId: defaultBranch?._id,
  //     type: EntityType.PLATFORM,
  //   })

  //   if (
  //     platformsCount >= (platformLimitation?.metadata.count as number)
  //   ) {
  //     return {
  //       currentCount: platformsCount,
  //       maxCount: platformLimitation?.metadata.count as number,
  //       entity: EntityType.PLATFORM,
  //     }
  //   }

  //   return false
  // }
}
