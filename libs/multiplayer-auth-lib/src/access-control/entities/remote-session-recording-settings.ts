import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class RemoteSessionRecordingSettings extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS
  }
  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
      }).unknown().required(),
      body: Joi.any(),
    })
  }
  getParams(params: any) {
    const contextParams: {
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return true
  }
}
