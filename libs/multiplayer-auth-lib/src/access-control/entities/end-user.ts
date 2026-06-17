import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'
import { EndUserModel } from '@multiplayer/models'

export class EndUser extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.END_USER
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        endUserId: Joi.string().hex().length(24),
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

    if (params.endUserId) {
      contextParams._id = params.endUserId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const endUser = await EndUserModel.findEndUserByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!endUser
  }
}
