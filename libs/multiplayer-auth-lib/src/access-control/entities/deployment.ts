import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { DeploymentModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class Deployment extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.DEPLOYMENT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        deploymentId: Joi.string().hex().length(24),
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

    if (params.deploymentId) {
      contextParams._id = params.deploymentId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const deployment = await DeploymentModel.findDeploymentByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!deployment
  }
}
