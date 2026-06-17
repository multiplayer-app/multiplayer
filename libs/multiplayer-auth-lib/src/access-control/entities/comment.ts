import {
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { CommentModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class Comment extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.COMMENT
  }
  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        commentId: Joi.string().hex().length(24),
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

    if (params.commentId) {
      contextParams._id = params.commentId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const comment = await CommentModel.findCommentByIdInProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!comment
  }
}
