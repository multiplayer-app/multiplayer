import {
  CommentCreatePayload,
  CommentUpdatePayload,
  IComment,
} from '@multiplayer/types'
import { type AxiosInstance } from '@multiplayer/fetch'

export class CommentService {
  private readonly baseUrl: string
  private instance: AxiosInstance

  constructor(instance: AxiosInstance, workspaceId = '', projectId = '') {
    this.instance = instance
    this.baseUrl = `/workspaces/${workspaceId}/projects/${projectId}/comments`
  }

  get(commentId: string): Promise<IComment> {
    return this.instance.get(`${this.baseUrl}/${commentId}`)
  }

  create(payload: CommentCreatePayload): Promise<IComment> {
    return this.instance.post(`${this.baseUrl}`, {
      threadId: payload.thread,
      content: payload.content,
    })
  }

  update(commentId: string, payload: CommentUpdatePayload): Promise<IComment> {
    return this.instance.patch(`${this.baseUrl}/${commentId}`, {
      content: payload.content,
    })
  }

  delete(commentId: string): Promise<void> {
    return this.instance.delete(`${this.baseUrl}/${commentId}`)
  }
}
