import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { CommitModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class Commit extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.COMMIT
  }
  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        commitId: Joi.string().hex().length(24),
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

    if (params.commitId) {
      contextParams._id = params.commitId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const commit = await CommitModel.findCommitByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!commit
  }
}
