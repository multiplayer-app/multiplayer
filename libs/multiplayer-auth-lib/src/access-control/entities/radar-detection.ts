import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class RadarDetection extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.RADAR_DETECTION
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
      _id?: string,
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      _id: params._id,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    return !!this.context.projects.find((project) =>
      project.projectId === this.params.projectId,
    )
  }
}
