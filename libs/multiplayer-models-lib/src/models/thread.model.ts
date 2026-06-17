import { mongoose, ObjectId } from '@multiplayer/mongo'
import {
  DataWithCursor,
  ICursor,
  IThread,
  IThreadResponse,
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'
import { Model, UpdateQuery } from 'mongoose'
import { SortOrder } from '../types'
import { LIMIT, SKIP } from '../config'

const { Schema } = mongoose

export interface IThreadDocument extends Omit<IThread, '_id' | 'firstComment' | 'project' | 'workspace'> {
  _id: ObjectId
  firstComment: ObjectId
  project: ObjectId
  workspace: ObjectId
  toObject(): IThreadDocument
  toJSON(): IThread
}

export interface IThreadModel extends Model<IThreadDocument> {
  createThread(
    payload: Partial<IThread>
  ): Promise<IThreadDocument>

  findThreadById(
    id: string | ObjectId
  ): Promise<IThreadDocument | undefined>

  findThreads(
    projectId: ObjectId | string,
    filter: Partial<IThread> & { threads?: string[] | ObjectId[] },
    cursor?: ICursor,
    sortOrder?: SortOrder
  ): Promise<DataWithCursor<IThreadResponse>>

  findThreadByIdInProjectAndWorkspace (
    id: string | ObjectId,
    project: string | ObjectId,
    workspace: string | ObjectId): Promise<IThreadDocument | undefined>

  updateThreadById(
    id: string | ObjectId,
    updateQuery: UpdateQuery<IThreadDocument>
  ): Promise<IThreadDocument | undefined>

  deleteThreadById(
    id: string | ObjectId
  ): Promise<void>

  getThreadsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IThread>
  ): any

  deleteThreadsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteThreadsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>
}

const ThreadSchema = new Schema({
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
  branch: {
    type: ObjectId,
    ref: 'Project-Branch',
  },
  objectId: {
    type: ObjectId,
  },
  objectType: {
    type: String,
    enum: Object.values(ObjectTypeEnum),
  },
  initiator: {
    type: ObjectId,
    ref: 'Workspace-User',
    required: true,
  },
  usersInDiscussion: [{
    type: ObjectId,
    ref: 'Workspace-User',
  }],
  firstComment: {
    type: ObjectId,
    ref: 'Comment',
    required: true,
  },
  totalComments: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(ThreadStatus),
  },
  commentablePath: [{
    type: String,
  }],
  position: [{
    type: Number,
  }],
  lastActivityAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
})

ThreadSchema.statics.createThread = function (
  payload: Partial<IThread>,
): Promise<IThreadDocument> {
  return new this(payload).save()
}

ThreadSchema.statics.findThreadById = function (
  id: string | ObjectId,
): Promise<IThreadDocument | undefined> {
  return this.findOne({ _id: id })
}

ThreadSchema.statics.findThreadByIdInProjectAndWorkspace = function (
  id: string | ObjectId,
  project: string | ObjectId,
  workspace: string | ObjectId): Promise<IThreadDocument | undefined> {
  return this.findOne({ _id: id, project, workspace })
}

ThreadSchema.statics.findThreads = async function (
  projectId: ObjectId,
  filter: Partial<IThread> & { threads?: string[] | ObjectId[] },
  cursor: ICursor,
  sortOrder: SortOrder = SortOrder.ASC,
): Promise<DataWithCursor<IThreadResponse>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: {
    branch?:ObjectId,
    objectId?: ObjectId,
    objectType?: ObjectTypeEnum,
    status?: string,
    project: ObjectId,
    _id?: { $in: ObjectId[] | string[] } } = { project: new ObjectId(projectId) }

  if (filter.branch) conditions.branch = new ObjectId(filter.branch)
  if (filter.objectId) conditions.objectId = new ObjectId(filter.objectId)
  if (filter.objectType) conditions.objectType = filter.objectType
  if (filter.status) conditions.status = filter.status
  if (filter.threads) conditions._id = { $in: filter.threads }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    { $match: conditions },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: { _id: (sortOrder === SortOrder.ASC) ? 1 : -1 } },
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          {
            $lookup: {
              from: 'comments',
              localField: '_id',
              foreignField: 'thread',
              as: 'comments',
              pipeline: [{ $limit: 10 }],
            },
          },
          {
            $lookup: {
              from: 'entities',
              localField: 'objectId',
              foreignField: 'entityId',
              as: 'entity',
              pipeline: [
                { $limit: 1 },
                { $project: { entityId: 1, type: 1 } },
              ],
            },
          },
          {
            $unwind: {
              path: '$entity',
              preserveNullAndEmptyArrays: true,
            },
          },
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

ThreadSchema.statics.updateThreadById = function (
  id: string | ObjectId,
  updateQuery: UpdateQuery<IThreadDocument>,
): Promise<IThreadDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    updateQuery,
    {
      new: true,
      runValidators: true,
    },
  )
}

ThreadSchema.statics.deleteThreadById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({ _id: id })
}

ThreadSchema.statics.deleteThreadsByEntityAndBranch = function (
  entityId: string | ObjectId,
  branchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({ entity: entityId, branch: branchId })
}

ThreadSchema.statics.getThreadsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IThread>,
): any {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

ThreadSchema.statics.deleteThreadsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ThreadSchema.statics.deleteThreadsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

export const ThreadModel = mongoose.model<IThreadDocument, IThreadModel>('Thread', ThreadSchema)
