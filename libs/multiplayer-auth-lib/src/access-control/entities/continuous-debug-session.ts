import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class ContinuousDebugSession extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.CONTINUOUS_DEBUG_SESSION
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        continuousDebugSessionId: Joi.string(),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any) {
    const contextParams: {
      _id?: string,
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.continuousDebugSessionId) {
      contextParams._id = params.continuousDebugSessionId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return true
  }
}
