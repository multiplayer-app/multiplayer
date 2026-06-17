import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityCommitModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class EntityCommit extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.ENTITY_COMMIT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        entityCommitId: Joi.string().hex().length(24),
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

    if (params.entityCommitId) {
      contextParams._id = params.entityCommitId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const entityCommit = await EntityCommitModel.findEntityCommitByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!entityCommit
  }
}
