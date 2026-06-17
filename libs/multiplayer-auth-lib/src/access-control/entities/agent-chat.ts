import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { AgentChatModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class AgentChat extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.AGENT_CHAT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        chatId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(
    params: any,
    queryParams: any,
    body: any,
  ) {
    const contextParams: {
      _id?: string,
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.chatId) {
      contextParams._id = params.chatId || body.chatId || body._id
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const agentChat = await AgentChatModel.findAgentChatByChatId(
      this.params._id,
    )

    if (
      !agentChat
      || agentChat.workspace.toString() !== this.params.workspaceId
      || agentChat.project.toString() !== this.params.projectId
    ) {
      return false
    }
    return true
  }
}
