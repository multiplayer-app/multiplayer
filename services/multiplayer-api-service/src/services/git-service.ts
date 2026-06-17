import { INTERNAL_GIT_SERVICE_URI } from '../config'
import { IGitRef } from '@multiplayer/types'
import { AbstractService } from './abstract-service'

export class MultiplayerGitService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_GIT_SERVICE_URI
  }

  getContents(
    gitRef: IGitRef,
    projectId: string,
    workspaceId: string,
  ): Promise<string> {
    const pathURI = encodeURIComponent(gitRef.path || '')
    return this.instance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/git-repositories/git/${gitRef.repositoryId}/files/${pathURI}/contents`,
      { params: { ref: gitRef.branch }, responseType: 'text' },
    )
  }
}
export const multiplayerInternalGitService = new MultiplayerGitService()
