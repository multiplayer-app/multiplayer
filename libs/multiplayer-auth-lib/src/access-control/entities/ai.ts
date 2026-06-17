import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
  WorkspaceBillingFeatures,
} from '@multiplayer/types'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'
import * as WorkspaceFeaturesCache from '../../cache/workspace-features.cache'

export class Ai extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.AI
  }

  getParams(params: any, queryParams: any): {
    _id: string,
    workspaceId: string
  } {
    const contextParams: {
      _id: string,
      workspaceId: string,
    } = {
      _id: queryParams.workspace,
      workspaceId: queryParams.workspace,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return this.context.workspaceId === this.params._id
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object({
        workspace: Joi.string().hex().length(24).required(),
      }).unknown().required(),
      params: Joi.object(),
      body: Joi.any(),
    })
  }

  // async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
  //   currentCount?: number,
  //   maxCount?: number,
  //   enabled?: boolean,
  //   entity: string,
  // } | false> {
  //   const workspaceFeatures = await WorkspaceFeaturesCache.get(this.params.workspaceId)

  //   const aiFeature = workspaceFeatures.find(({ name }) => name === WorkspaceBillingFeatures.WORKSPACE_AI)

  //   if (aiFeature?.metadata?.enabled) {
  //     return false
  //   }

  //   return {
  //     enabled: !!aiFeature?.metadata?.enabled,
  //     entity: RoleWorkspacePermissionEntity.AI,
  //   }
  // }
}
