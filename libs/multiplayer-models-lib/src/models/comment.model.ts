import { mongoose, ObjectId } from '@multiplayer/mongo'
import {
  DataWithCursor,
  IComment,
  ICursor,
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'
import { Model, PipelineStage } from 'mongoose'
import { LIMIT, SKIP } from '../config'
import { MongoPayload } from '@multiplayer/util'
import { SortOrder } from '../types'

const { Schema } = mongoose

export interface ICommentDocument extends Omit<IComment, '_id'> {
  _id: ObjectId
  toObject(): ICommentDocument
  toJSON(): IComment
}

export interface ICommentModel extends Model<ICommentDocument> {
  createComment(
    payload: Partial<IComment>
  ): Promise<ICommentDocument>

  findCommentById(
    id: string | ObjectId
  ): Promise<ICommentDocument | undefined>

  findCommentByIdInProjectAndWorkspace(
    id: string | ObjectId,
    project: string | ObjectId,
    workspace: string | ObjectId): Promise<ICommentDocument | undefined>

  findComments(
    filter: {
      project: string
      objectId?: string,
      objectType?: ObjectTypeEnum,
      branch?: string
      thread?: string
      workspaceUser?: string,
      status?: ThreadStatus,
      branchOnly?: boolean
    },
    cursor: ICursor,
    sortOrder?: SortOrder
  ): Promise<DataWithCursor<ICommentDocument>>

  searchThreadsByComments(
    projectId: string | ObjectId,
    filter: {
      search?: string,
      branch?: string,
      objectId?: string,
      objectType?: ObjectTypeEnum
      status?: ThreadStatus,
      branchOnly?: boolean
    },
    cursor: ICursor,
    sortOrder: SortOrder,
  ): Promise<DataWithCursor<{ _id: ObjectId }>>

  updateCommentById(
    id: string | ObjectId,
    payload: object
  ): Promise<ICommentDocument | undefined>

  deleteCommentById(
    id: string | ObjectId
  ): Promise<void>

  findCommentAndDeleteById(
    id: string | ObjectId
  ): Promise<ICommentDocument>

  deleteCommentsByThreadId(
    id: string | ObjectId
  ): Promise<void>

  deleteCommentsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteCommentsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  getCommentsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IComment>
  ): any
}

const CommentSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    required: true,
  },
  objectId: {
    type: ObjectId,
  },
  objectType: {
    type: String,
    enum: Object.values(ObjectTypeEnum),
  },
  thread: {
    type: ObjectId,
    ref: 'Thread',
    required: true,
  },
  branch: {
    type: ObjectId,
    ref: 'Project-Branch',
  },
  workspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User', //?user
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
})
CommentSchema.statics.createComment = function (payload: Partial<IComment>): Promise<ICommentDocument> {
  return new this(payload).save()
}

CommentSchema.statics.findCommentById = function (id: string | ObjectId): Promise<ICommentDocument | undefined> {
  return this.findOne({ _id: id })
}

CommentSchema.statics.findCommentByIdInProjectAndWorkspace = function (
  id: string | ObjectId,
  project: string | ObjectId,
  workspace: string | ObjectId): Promise<ICommentDocument | undefined> {
  return this.findOne({ _id: id, project, workspace })
}

CommentSchema.statics.searchThreadsByComments = async function (
  projectId: string | ObjectId,
  filter: {
    search?: string,
    branch?: string,
    objectId?: string,
    objectType?: ObjectTypeEnum
    status?: ThreadStatus,
    branchOnly?: boolean
  },
  cursor: ICursor,
  sortOrder: SortOrder = SortOrder.ASC,
): Promise<DataWithCursor<{ _id: ObjectId }>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: {
    project: ObjectId,
    branch?: ObjectId,
    $text?: { $search: string },
    content?: { $regex: string, $options: string },
    objectId?: ObjectId | { $exists: boolean },
    objectType?: ObjectTypeEnum,
  } = { project: new ObjectId(projectId) }

  if (filter.branch) conditions.branch = new ObjectId(filter.branch)
  if (filter.search) conditions.content = { $regex: filter.search, $options: 'i' }
  if (filter.branchOnly) conditions.objectId = { $exists: false }
  if (filter.objectId) conditions.objectId = new ObjectId(filter.objectId)
  if (filter.objectType) conditions.objectType = filter.objectType

  const threadConditions: {
    status?: ThreadStatus
  } = {}

  if (filter.status) threadConditions.status = filter.status

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    { $match: conditions },
    {
      $lookup: {
        from: 'threads',
        localField: 'thread',
        foreignField: '_id',
        as: 'thread',
        pipeline: [{ $match: threadConditions }],
      },
    },
    {
      $unwind: { path: '$thread', preserveNullAndEmptyArrays: false },
    },
    {
      $group: {
        _id: '$thread._id',
        matchedCommentsCount: { $count: {} },
      },
    },
    { $sort: { _id: (sortOrder === SortOrder.ASC) ? 1 : -1 } },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

CommentSchema.statics.findComments = async function (
  filter: {
    project: string,
    objectId?: string,
    objectType?: ObjectTypeEnum,
    branch?: string,
    thread?: string,
    workspaceUser?: string
    status?: ThreadStatus,
    branchOnly: boolean
  },
  cursor: ICursor,
  sortOrder: SortOrder = SortOrder.ASC,
): Promise<DataWithCursor<ICommentDocument>> {
  const _filter = MongoPayload.removeUndefinedProps(filter)

  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: {
    project: ObjectId,
    thread?: ObjectId,
    workspaceUser?: ObjectId,
    branch?: ObjectId,
    objectId?: ObjectId | { $exists: boolean },
    objectType?: ObjectTypeEnum
  } = {
    project: new ObjectId(_filter.project),
  }

  if (_filter.thread) conditions.thread = new ObjectId(_filter.thread)
  if (_filter.workspaceUser) conditions.workspaceUser = new ObjectId(_filter.workspaceUser)
  if (_filter.objectId) conditions.objectId = new ObjectId(_filter.objectId)
  if (_filter.objectType) conditions.objectType = _filter.objectType
  if (_filter.branchOnly) conditions.objectId = { $exists: false }
  if (_filter.branch) conditions.branch = new ObjectId(_filter.branch)

  let threadFilters: PipelineStage[] = []
  if (_filter.status) {
    threadFilters = [
      {
        $lookup: {
          from: 'threads',
          localField: 'thread',
          foreignField: '_id',
          as: '_thread',
          pipeline: [{ $match: { status: _filter.status } }],
        },
      },
      { $unwind: { path: '$_thread', preserveNullAndEmptyArrays: false } },
      { $unset: '_thread' }]
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    { $match: conditions },
    { $sort: { _id: (sortOrder === SortOrder.ASC) ? 1 : -1 } },
    ...threadFilters,
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          {
            $lookup: {
              from: 'workspace-users',
              localField: 'workspaceUser',
              foreignField: '_id',
              as: 'workspaceUser',
            },
          },
          { $unwind: { path: '$workspaceUser', preserveNullAndEmptyArrays: true } },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

CommentSchema.statics.updateCommentById = function (
  id: string | ObjectId,
  payload: object,
): Promise<ICommentDocument | undefined> {
  const _payload = MongoPayload.flattenObject(payload)

  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: _payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

CommentSchema.statics.deleteCommentById = function (id: string | ObjectId): Promise<void> {
  return this.deleteOne({ _id: id })
}

CommentSchema.statics.findCommentAndDeleteById = function (id: string | ObjectId): Promise<ICommentDocument> {
  return this.findOneAndDelete({ _id: id })
}

CommentSchema.statics.deleteCommentsByThreadId = function (id: string | ObjectId): Promise<void> {
  return this.deleteMany({ thread: id })
}

CommentSchema.statics.deleteCommentsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

CommentSchema.statics.deleteCommentsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

CommentSchema.statics.getCommentsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IComment>,
): any {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

CommentSchema.index({ content: 'text' })

export const CommentModel = mongoose.model<ICommentDocument, ICommentModel>('Comment', CommentSchema)
