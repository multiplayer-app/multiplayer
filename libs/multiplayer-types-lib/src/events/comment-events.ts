import { IThread, IThreadResponse } from '../thread'
import { IComment } from '../comment'
import { CallbackData } from './callback-data'

export enum CommentsEvents {
  THREAD_CREATE= 'v0/thread/create',
  THREAD_DELETE= 'v0/thread/delete',
  THREAD_UPDATE = 'v0/thread/update',
  COMMENT_CREATE= 'v0/comment/create',
  COMMENT_DELETE= 'v0/comment/delete',
  COMMENT_UPDATE = 'v0/comment/update',
}

export type ThreadCreatePayload = Pick<IThread, 'branch' | 'objectId'| 'objectType' | 'commentablePath' | 'position'> &
Pick<IComment, 'content'>
export type ThreadUpdatePayload = Pick<IThread, 'status' | 'commentablePath' | 'position'>

export type CommentCreatePayload = Pick<IComment, 'thread' | 'content'>
export type CommentUpdatePayload = Pick<IComment, 'thread' | 'content'>

export type CommentsClientEventsMap = {
  [CommentsEvents.THREAD_CREATE]: (payload: ThreadCreatePayload, callback?: (data: CallbackData<IThreadResponse>) => void) => void
  [CommentsEvents.THREAD_DELETE]: (threadId: string, callback?: (data: CallbackData<string>) => void) => void
  [CommentsEvents.THREAD_UPDATE]: (threadId: string, payload: ThreadUpdatePayload, callback?: (data: CallbackData<IThread>) => void) => void
  [CommentsEvents.COMMENT_CREATE]: (payload: CommentCreatePayload, callback?: (data: CallbackData<IComment>) => void) => void
  [CommentsEvents.COMMENT_DELETE]: (commentId: string, callback?: (data: CallbackData<string>) => void) => void
  [CommentsEvents.COMMENT_UPDATE]: (commentId: string, payload: CommentUpdatePayload, callback?: (data: CallbackData<IComment>) => void) => void
}

export type CommentsServerEventsMap = {
  [CommentsEvents.THREAD_CREATE]: (thread: IThreadResponse) => void
  [CommentsEvents.THREAD_DELETE]: (threadId: string) => void
  [CommentsEvents.THREAD_UPDATE]: (thread: IThread & { comments?: IComment[], entity?: any }) => void
  [CommentsEvents.COMMENT_CREATE]: (comment: IComment) => void
  [CommentsEvents.COMMENT_DELETE]: (commentId: string) => void
  [CommentsEvents.COMMENT_UPDATE]: (comment: IComment) => void
}
