import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'
import { FlowMetadataModel } from '@multiplayer/models'

export class Flows extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.FLOW
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        flowId: Joi.string(),
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

    if (params.flowId) {
      contextParams._id = params.flowId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const flow = await FlowMetadataModel.findFlowMetadataByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!flow
  }
}
