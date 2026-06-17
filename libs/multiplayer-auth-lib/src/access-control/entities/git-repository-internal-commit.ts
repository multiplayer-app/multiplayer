import { RoleProjectPermissionEntity } from '@multiplayer/types'
import {
  GitRepositoryModel,
  IGitRepositoryDocument,
} from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class GitRepositoryInternalCommit extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        gitRepositoryId: Joi.string().hex().length(24),
        gitId: Joi.string(),
      }).unknown().required(),
      body: Joi.any(),
    })
  }
  getParams(params: any) {
    const contextParams: {
      _id: string,
      gitId?: string,
      gitRepositoryId?: string,
      workspaceId: string,
      projectId: string,
    } = {
      _id: params.gitRepositoryId || params.gitId,
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      gitRepositoryId: params.gitRepositoryId,
      gitId: params.gitId,
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    let gitRepository: IGitRepositoryDocument | undefined

    if (this.params.gitRepositoryId) {
      gitRepository = await GitRepositoryModel.findGitRepositoryByIdAndProjectAndWorkspace(
        this.params.gitRepositoryId,
        this.params.workspaceId,
        this.params.projectId,
      )
    } else {
      gitRepository = await GitRepositoryModel.findGitRepositoryByGitId(
        this.params.gitId,
        this.params.workspaceId,
        this.params.projectId,
      )
    }

    return !!gitRepository
  }
}
