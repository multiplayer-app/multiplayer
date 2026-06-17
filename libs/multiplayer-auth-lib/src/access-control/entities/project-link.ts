import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { ProjectLinkModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class ProjectLink extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.PROJECT_LINK
  }
  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        projectLinkId: Joi.string().hex().length(24),
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

    if (params.projectLinkId) {
      contextParams._id = params.projectLinkId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const projectLink = await ProjectLinkModel.findProjectLinkByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!projectLink
  }
}
