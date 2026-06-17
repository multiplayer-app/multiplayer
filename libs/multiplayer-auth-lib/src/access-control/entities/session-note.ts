import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { DebugSessionModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class SessionNote extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.SESSION_NOTES
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        debugSessionId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any) {
    const contextParams: {
      workspaceId: string
      projectId: string
      _id: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      _id: params.debugSessionId,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const debugSession = await DebugSessionModel.findDebugSessionByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )
    return !!debugSession
  }
}
