import {
  IThread,
  IThreadResponse,
  ThreadCreatePayload,
  ThreadUpdatePayload,
} from '@multiplayer/types'
import { type AxiosInstance } from '@multiplayer/fetch'

export class ThreadService {
  private readonly baseUrl: string
  private instance: AxiosInstance

  constructor(instance: AxiosInstance, workspaceId = '', projectId = '') {
    this.instance = instance
    this.baseUrl = `/workspaces/${workspaceId}/projects/${projectId}/threads`
  }

  get(threadId: string): Promise<IThread> {
    return this.instance.get(`${this.baseUrl}/${threadId}`)
  }

  create(payload: ThreadCreatePayload): Promise<IThreadResponse> {
    return this.instance.post(this.baseUrl, payload)
  }

  update(threadId: string, payload: ThreadUpdatePayload): Promise<IThread> {
    return this.instance.patch(`${this.baseUrl}/${threadId}`, payload)
  }

  delete(threadId: string): Promise<void> {
    return this.instance.delete(`${this.baseUrl}/${threadId}`)
  }
}
