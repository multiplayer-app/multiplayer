import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { IssueModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class Issue extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.ISSUE
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        issueId: Joi.string().hex().length(24),
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

    if (params.issueId) {
      contextParams._id = params.issueId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const issue = await IssueModel.findIssueByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!issue
  }
}
