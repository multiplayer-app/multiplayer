import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { VariableSchemaModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class VariableSchema extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.VARIABLE_SCHEMA
  }
  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        environmentId: Joi.string().hex().length(24),
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

    if (params.environmentId) {
      contextParams._id = params.environmentId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const environment = await VariableSchemaModel.findVariableSchemaByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!environment
  }
}
