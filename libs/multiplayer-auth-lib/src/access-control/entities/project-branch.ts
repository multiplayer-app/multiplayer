import {
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { ProjectBranchModel } from '@multiplayer/models'
import { Joi } from '@multiplayer/util'

export class ProjectBranch extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.PROJECT_BRANCH
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object({
        projectBranch: Joi.string().hex().length(24),
      }).unknown(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        projectBranchId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any, queryParams: any) {
    const contextParams: {
      _id?: string,
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.projectBranchId) {
      contextParams._id = params.projectBranchId
    } else if (queryParams.projectBranch) {
      contextParams._id = queryParams.projectBranch
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const branch = await ProjectBranchModel.findProjectBranch(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!branch
  }
}

export class ProjectBranchReview extends ProjectBranch {
  getEntityType() {
    return RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW
  }
}
