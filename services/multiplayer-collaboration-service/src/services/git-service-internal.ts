import { type IGitRef } from '@multiplayer/types'
import { AbstractService } from './abstract-service'
import { INTERNAL_GIT_SERVICE_URI } from '../config'

export class GitService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_GIT_SERVICE_URI
  }

  getContents(
    gitRef: IGitRef,
    projectId: string,
    workspaceId: string,
  ): Promise<any> {
    const pathURI = encodeURIComponent(gitRef.path || '')
    return this.instance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/git-repositories/git/${gitRef.repositoryId}/files/${pathURI}/contents`,
      { params: { ref: gitRef.branch }, responseType: 'text' },
    )
  }

  async commit(payload: {
    workspaceId: string,
    projectId: string,
    gitRepositoryId: string
    gitBranch: string
    contents: {
      action: string
      filePath: string,
      content: string,
    }[],
    commitMessage: string,
  }): Promise<any> {
    return this.instance.post(
      `/workspaces/${payload.workspaceId}/projects/${payload.projectId}/git-repositories/git/${payload.gitRepositoryId}/branches/${encodeURIComponent(payload.gitBranch)}/commit`,
      {
        commitMessage: payload.commitMessage,
        contents: payload.contents,
      },
    )
  }
}
