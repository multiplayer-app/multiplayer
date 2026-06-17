import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { ThreadModel } from '@multiplayer/models'
import { Joi } from '@multiplayer/util'

export class Thread extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.THREAD
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        threadId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }
  getParams(params: any) {
    const contextParams: {
      workspaceId: string
      projectId: string
      _id?: string,
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.threadId) {
      contextParams._id = params.threadId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const thread = await ThreadModel.findThreadByIdInProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!thread
  }
}
