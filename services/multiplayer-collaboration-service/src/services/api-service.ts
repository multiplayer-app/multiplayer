import { AbstractService } from './abstract-service'
import { API_SERVICE_URI } from '../config'
import { CommentService } from './api/comment-service'
import { ThreadService } from './api/thread-service'

export class ApiService extends AbstractService {
  protected getBaseUrl() {
    return API_SERVICE_URI
  }

  public getCommentApi(workspaceId = '', projectId = '') {
    return new CommentService(this.instance, workspaceId, projectId)
  }

  public getThreadApi(workspaceId = '', projectId = '') {
    return new ThreadService(this.instance, workspaceId, projectId)
  }
}
