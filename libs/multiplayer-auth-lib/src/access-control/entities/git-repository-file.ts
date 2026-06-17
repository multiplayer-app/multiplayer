import { RoleWorkspacePermissionEntity } from '@multiplayer/types'
import { IntegrationModel } from '@multiplayer/models'
import { EntityBaseWorkspaceLevel } from '../base/base-entity-workspace'
import { Joi } from '@multiplayer/util'

export class GitRepositoryFile extends EntityBaseWorkspaceLevel {
  getEntityType() {
    return RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        repositoryId: Joi.string().hex().length(24).required(),
        integrationId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }
  getParams(params: any) {
    const contextParams: {
      _id?: string,
      workspaceId: string,
      repositoryId: string,
    } = {
      _id: params.integrationId,
      workspaceId: params.workspaceId,
      repositoryId: params.repositoryId,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const integration = await IntegrationModel.findIntegrationByIdInWorkspace(
      this.params._id,
      this.params.workspaceId,
    )

    return !!integration
  }
}
