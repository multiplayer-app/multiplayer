import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { AgentModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class Agent extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.AGENT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        agentId: Joi.string().hex().length(24),
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

    if (params.agentId) {
      contextParams._id = params.agentId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const agent = await AgentModel.findAgentByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!agent
  }
}
