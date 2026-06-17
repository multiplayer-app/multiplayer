import { BroadcastOperator, Socket } from 'socket.io'
import {
  CallbackData,
  CommentCreatePayload,
  CommentsEvents,
  CommentsClientEventsMap, CommentsServerEventsMap,
  CommentUpdatePayload,
  IComment, IThread, IThreadResponse,
  ThreadCreatePayload,
  ThreadUpdatePayload, ContextLimitingEvents, ContextLimitingClientEventsMap,
} from '@multiplayer/types'
import { Observable } from 'lib0/observable'
import { DefaultEventsMap } from 'socket.io'
import { ProjectSocketData } from '../interfaces/project-socket-data'
import { CommentService } from '../services/api/comment-service'
import { ThreadService } from '../services/api/thread-service'
import logger from '@multiplayer/logger'
import { getProcessedError } from './error.callback.handler'
import { ApiService } from '../services/api-service'
import { BroadcastHelper } from './broadcast.helper'

export class CommentsHandler extends Observable<string> {
  private socket: Socket<CommentsClientEventsMap & ContextLimitingClientEventsMap, CommentsServerEventsMap, DefaultEventsMap, ProjectSocketData>
  private readonly projectId: string
  private commentsService: CommentService
  private threadService: ThreadService

  constructor(projectId: string,
    socket: Socket<CommentsClientEventsMap & ContextLimitingClientEventsMap, CommentsServerEventsMap, DefaultEventsMap, ProjectSocketData>) {
    super()
    this.socket = socket
    this.projectId = projectId
    const sessionCookie = socket.handshake.headers.cookie
    const apiService = new ApiService(sessionCookie)

    this.commentsService = apiService.getCommentApi(
      socket.data.workspaceId,
      socket.data.projectId,
    )

    this.threadService = apiService.getThreadApi(
      socket.data.workspaceId,
      socket.data.projectId,
    )
  }

  setListeners() {
    //require UPDATE level
    this.socket.on(CommentsEvents.THREAD_CREATE, this.onThreadCreate.bind(this))
    this.socket.on(CommentsEvents.THREAD_UPDATE, this.onThreadUpdate.bind(this))
    this.socket.on(CommentsEvents.THREAD_DELETE, this.onThreadDelete.bind(this))
    this.socket.on(CommentsEvents.COMMENT_CREATE, this.onCommentCreate.bind(this))
    this.socket.on(CommentsEvents.COMMENT_UPDATE, this.onCommentUpdate.bind(this))
    this.socket.on(CommentsEvents.COMMENT_DELETE, this.onCommentDelete.bind(this))

    this.socket.on(ContextLimitingEvents.THREAD_SUBSCRIBE, this.onThreadSubscribe.bind(this))
    this.socket.on(ContextLimitingEvents.THREAD_UNSUBSCRIBE, this.onThreadUnsubscribe.bind(this))
  }

  onThreadSubscribe(threadId: string) {
    this.socket.join(BroadcastHelper.getThreadRoomName(threadId))
  }
  onThreadUnsubscribe(threadId: string) {
    this.socket.leave(BroadcastHelper.getThreadRoomName(threadId))
  }

  getAcrossThreadBroadcast(threadId: string): BroadcastOperator<CommentsServerEventsMap, ProjectSocketData> {
    return this.socket.broadcast.to(BroadcastHelper.getThreadRoomName(threadId))
  }

  async onThreadCreate(payload: ThreadCreatePayload, callback?: (data: CallbackData<IThreadResponse>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const thread = await this.threadService.create(payload)
      callback?.({ data: thread })
      BroadcastHelper.getBranchBroadcast(this.socket, thread.branch).emit(CommentsEvents.THREAD_CREATE, thread)
    } catch (err) {
      logger.error(err, 'onThreadCreate')
      callback?.({ error: getProcessedError(err) })
    }
  }

  async onThreadDelete(threadId: string, callback?: (data: CallbackData<string>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const thread = await this.threadService.get(threadId)
      await this.threadService.delete(threadId)
      callback?.({ data: threadId })
      if (thread) {
        BroadcastHelper.getBranchBroadcast(this.socket, thread.branch).emit(CommentsEvents.THREAD_DELETE, threadId)
      }
    } catch (err) {
      logger.error('onThreadDelete', err)
      callback?.({ error: getProcessedError(err) })
    }
  }

  async onThreadUpdate(threadId: string, payload: ThreadUpdatePayload, callback?: (data: CallbackData<IThread>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const thread = await this.threadService.update(threadId, payload)
      callback?.({ data: thread })
      BroadcastHelper.getBranchBroadcast(this.socket, thread.branch).emit(CommentsEvents.THREAD_UPDATE, thread)
    } catch (err) {
      logger.error('onThreadUpdate', err)
      callback?.({ error: getProcessedError(err) })
    }
  }

  async onCommentCreate(payload: CommentCreatePayload, callback?: (data: CallbackData<IComment>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const comment = await this.commentsService.create(payload)
      callback?.({ data: comment })
      this.getAcrossThreadBroadcast(comment.thread).emit(CommentsEvents.COMMENT_CREATE, comment)

      const thread = await this.threadService.get(comment.thread)
      BroadcastHelper.getBranchBroadcast(this.socket, thread.branch).emit(CommentsEvents.THREAD_UPDATE, {
        ...thread,
        comments: [comment],
      })
    } catch (err) {
      logger.error(`onCommentCreate failed with ${err}`)
      callback?.({ error: getProcessedError(err) })
    }
  }
  async onCommentDelete(commentId: string, callback?: (data: CallbackData<string>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const comment = await this.commentsService.get(commentId)
      await this.commentsService.delete(commentId)
      callback?.({ data: commentId })
      BroadcastHelper.getBranchBroadcast(this.socket, comment.thread).emit(CommentsEvents.COMMENT_DELETE, commentId)

      const thread = await this.threadService.get(comment.thread)
      if (!thread) {
        BroadcastHelper.getBranchBroadcast(this.socket, comment.branch).emit(CommentsEvents.THREAD_DELETE, comment.thread)
      } else {
        BroadcastHelper.getBranchBroadcast(this.socket, comment.branch).emit(CommentsEvents.THREAD_UPDATE, thread)
      }

    } catch (err) {
      logger.error(`onCommentDelete failed with ${err}`)
      callback?.({ error: getProcessedError(err) })
    }
  }
  async onCommentUpdate(commentId: string, payload: CommentUpdatePayload, callback?: (data: CallbackData<IComment>) => void) {
    if (!this.socket.data.allowEdit) {
      callback?.({ error: { status: 403, message: 'Action requires write access' } })
      return
    }
    try {
      const comment = await this.commentsService.update(commentId, payload)
      callback?.({ data: comment })
      this.getAcrossThreadBroadcast(comment.thread).emit(CommentsEvents.COMMENT_UPDATE, comment)
    } catch (err) {
      logger.error(`onCommentUpdate failed with ${err}`)
      callback?.({ error: getProcessedError(err) })
    }
  }
}
