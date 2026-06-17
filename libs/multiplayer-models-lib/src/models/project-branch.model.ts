import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IProjectBranch,
  ProjectBranchStatus,
  ProjectBranchType,
  ProjectBranchReviewState,
  IBranchReview,
  ICursor,
  DataWithCursor,
  ListBranchReviewsResponse,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'
import { IWorkspaceUserDocument } from './workspace-user.model'

const { Schema } = mongoose

export interface IProjectBranchDocument extends Omit<IProjectBranch, '_id' | 'parentProjectBranch' | 'project' | 'reviews'>, Document {
  _id: ObjectId

  project: ObjectId

  parentProjectBranch: ObjectId

  reviews: {
    _id: ObjectId
    workspaceUser: ObjectId
    state: ProjectBranchReviewState,
    thread?: ObjectId
    createdAt: string | Date
    updatedAt: string | Date
  }[]

  toObject(): IProjectBranchDocument
  toJSON(): IProjectBranch
}

export interface IProjectProjectBranchModel extends Model<IProjectBranchDocument> {
  createProjectBranch(
    payload: object
  ): Promise<IProjectBranchDocument>

  findProjectBranch (
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IProjectBranchDocument | undefined>

  findProjectBranchById(
    id: string | ObjectId
  ): Promise<IProjectBranchDocument | undefined>

  getDefaultProjectBranch(
    projectId: string | ObjectId
  ): Promise<IProjectBranchDocument | undefined>

  findProjectBranches(
    filter: {
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      status?: ProjectBranchReviewState | ProjectBranchReviewState[]
      archived?: boolean
      default?: boolean
      name?: string
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IProjectBranchDocument>>

  updateProjectBranchById(
    id: string | ObjectId,
    payload: object
  ): Promise<IProjectBranchDocument | undefined>

  deleteProjectBranchById(id: string | ObjectId): Promise<void>

  getProjectBranchTree(
    branchId: string | ObjectId
  ): Promise<Array<IProjectBranchDocument>>

  deleteBranchByIds(ids: Array<string | ObjectId>): Promise<void>
  findProjectBranchReviewsByBranchId (
    id: string | ObjectId,
    cursor?: ICursor
  ): Promise<DataWithCursor<ListBranchReviewsResponse>>
  addReviewers(
    id: string | ObjectId,
    workspaceUserIds: Array<string | ObjectId>,
  ): Promise<Array<IBranchReview>>

  addReview(
    id: string | ObjectId,
    workspaceUserId: string | ObjectId,
    payload?: { state: ProjectBranchReviewState, thread?: string | ObjectId },
  ): Promise<Array<IBranchReview>>

  updateReview(
    id: string | ObjectId,
    workspaceUserId: string | ObjectId,
    payload: { state: ProjectBranchReviewState, thread?: string | ObjectId },
  ): Promise<IBranchReview>

  removeReview(
    id: string | ObjectId,
    workspaceUserId: string | ObjectId,
  ): Promise<void>

  getWorkspaceUserByProjectBranchAndUserId(
    userId: string | ObjectId,
    branchId: string | ObjectId,
  ): Promise<IWorkspaceUserDocument>

  getProjectBranchesInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IProjectBranch>
  ): any

  deleteProjectBranchesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteProjectBranchesByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  findDependentProjectBranchesWithUnchangedEntity(
    projectBranchId: string | ObjectId,
    entityId: string | ObjectId,
  ): Promise<IProjectBranchDocument[]>
}

const BranchReviewSchema = new Schema({
  workspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User',
    required: false,
  },
  state: {
    type: String,
    enum: Object.values(ProjectBranchReviewState),
    required: false,
  },
  thread: {
    type: ObjectId,
    ref: 'Thread',
  },
}, {
  timestamps: true,
})

const ProjectBranchSchema = new Schema({
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
  name: {
    type: String,
    required: true,
  },
  parentProjectBranch: {
    type: ObjectId,
    ref: 'Project-Branch',
  },
  parentCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(ProjectBranchStatus),
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(ProjectBranchType),
  },
  archived: {
    type: Boolean,
    default: false,
  },
  default: {
    type: Boolean,
    default: false,
  },
  lastCommitMeta: {
    workspaceUsers: [{
      type: ObjectId,
      ref: 'Workspace-User',
      required: false,
    }],
    date: {
      type: Date,
    },
  },
  defaultGitBranchName: {
    type: String,
  },
  gitBranches: {
    type: Map,
    of: String,
  },
  reviews: [BranchReviewSchema],
}, {
  timestamps: true,
})

ProjectBranchSchema.statics.getWorkspaceUserByProjectBranchAndUserId = async function (
  userId: string | ObjectId,
  branchId: string | ObjectId,
): Promise<IWorkspaceUserDocument | undefined> {
  const res = await this.aggregate([
    {
      $match: {
        _id: new ObjectId(branchId) ,
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: 'project',
        foreignField: '_id',
        as: 'project',
      },
    },
    {
      $unwind: '$project',
    },
    {
      $replaceRoot: {
        newRoot: '$project',
      },
    },
    {
      $lookup: {
        from: 'workspaces',
        localField: 'workspace',
        foreignField: '_id',
        as: 'workspace',
      },
    },
    {
      $unwind: '$workspace',
    },
    {
      $replaceRoot: {
        newRoot: '$workspace',
      },
    },
    {
      $lookup: {
        from: 'workspace-users',
        localField: '_id',
        foreignField: 'workspace',
        as: 'workspaceUser',
        pipeline: [{
          $match: {
            user: new ObjectId(userId),
          },
        }],
      },
    },
    {
      $unwind: '$workspaceUser',
    },
    {
      $replaceRoot: {
        newRoot: '$workspaceUser',
      },
    },
  ])

  return (res.length) ? res[0] : undefined
}

ProjectBranchSchema.statics.createProjectBranch = function (payload: object) {
  return new this(payload).save()
}

ProjectBranchSchema.statics.findProjectBranchById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}
ProjectBranchSchema.statics.findProjectBranchReviewsByBranchId = async function (
  id: string | ObjectId,
  cursor: ICursor = {},
): Promise<DataWithCursor<ListBranchReviewsResponse>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT
  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    { $match: { _id: new ObjectId(id) } },
    { $unwind: '$reviews' },
    { $replaceRoot: { newRoot: '$reviews' } },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          {
            $lookup: {
              from: 'comments',
              localField: 'thread',
              foreignField: 'thread',
              as: 'comments',
              pipeline: [{ $limit: 10 }],
            },
          },
          {
            $lookup: {
              from: 'threads',
              localField: 'thread',
              foreignField: '_id',
              as: 'thread',
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

ProjectBranchSchema.statics.findProjectBranch = function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({ _id: id, project: projectId, workspace: workspaceId })
}

ProjectBranchSchema.statics.getDefaultProjectBranch = function (projectId: string | ObjectId) {
  return this.findOne({
    project: projectId,
    default: true,
  })
}

ProjectBranchSchema.statics.findDependentProjectBranchesWithUnchangedEntity = function (
  projectBranchId: string | ObjectId,
  entityId: string | ObjectId,
): Promise<IProjectBranchDocument[]> {
  return this.aggregate([
    {
      $match: {
        status: { $nin: [ProjectBranchStatus.MERGED, ProjectBranchStatus.CLOSED] },
        parentProjectBranch: new ObjectId(projectBranchId),
      },
    },
    {
      $lookup: {
        from: 'entities',
        localField: '_id',
        foreignField: 'projectBranch',
        as: 'entities',
        pipeline: [{
          $match: { entityId: new ObjectId(entityId) },
        }],
      },
    },
    {
      $match: { entities: { $size: 0 } },
    },
    {
      $lookup: {
        from: 'entity-updates',
        localField: '_id',
        foreignField: 'projectBranch',
        as: 'updates',
        pipeline: [{
          $match: { entityId: new ObjectId(entityId) },
        }],
      },
    },
    {
      $match: { updates: { $size: 0 } },
    },
    {
      $project: {
        entities: 0,
        updates: 0,
      },
    },
  ])
}

ProjectBranchSchema.statics.findProjectBranches = async function (
  filter: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    status?: ProjectBranchReviewState | ProjectBranchReviewState[]
    archived?: boolean
    default?: boolean
    name?: string
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {}

  if (filter.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.status) {
    conditions.status = Array.isArray(filter.status)
      ? { $in: filter.status }
      : filter.status
  }

  if ('archived' in filter) {
    if (filter.archived) {
      conditions.archived = true
    } else {
      conditions.archived = {
        $ne: true,
      }
    }
  }

  if ('default' in filter) {
    conditions.default = filter.default
  }

  if (filter.name) {
    conditions.name = {
      $options: 'i',
      $regex: filter.name,
    }
  }

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
      },
    },
    {
      $sort: _sort,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          {
            $lookup: {
              from: 'workspace-users',
              localField: 'lastCommitMeta.workspaceUsers',
              foreignField: '_id',
              as: 'lastCommitMeta.workspaceUsers',
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

ProjectBranchSchema.statics.updateProjectBranchById = function (
  id: string | ObjectId,
  payload: object,
) {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

ProjectBranchSchema.statics.deleteProjectBranchById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

ProjectBranchSchema.statics.getProjectBranchTree = async function (
  branchId: string | ObjectId,
) {
  return this.aggregate([
    {
      $match: {
        _id: new ObjectId(branchId),
      },
    },
    {
      $graphLookup: {
        as: 'parentBranches',
        connectFromField: 'parentProjectBranch',
        connectToField: '_id',
        from: 'project-branches',
        startWith: '$parentProjectBranch',
      },
    },

    {
      $unwind: {
        path: '$parentBranches',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $sort: { 'parentBranches._id': 1 },
    },
    {
      $group: {
        _id: '$_id',
        items: { $push: '$$ROOT.parentBranches' },
        root: { $push: '$$ROOT' },
      },
    },

    {
      $project: {
        items: 1,
        root: { $slice: ['$$ROOT.root', 0, 1] },
      },
    },

    {
      $project: {
        'root.parentBranches': 0,
      },
    },

    {
      $addFields: {
        allItems: {
          $concatArrays: ['$root', '$items'],
        },
      },
    },
    {
      $unwind: '$allItems',
    },
    {
      $replaceRoot: {
        newRoot: '$$ROOT.allItems',
      },
    },
  ])
}

ProjectBranchSchema.statics.deleteProjectBranchByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

ProjectBranchSchema.statics.addReviewers = async function (
  id: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
) {
  const conditions = {
    _id: id,
    'reviews.workspaceUser': {
      $nin: workspaceUserIds
        .map(workspaceUserId => new ObjectId(workspaceUserId)),
    },
  }
  const update = {
    $push: {
      reviews: {
        $each: workspaceUserIds.map(workspaceUserId => ({
          workspaceUser: new ObjectId(workspaceUserId),
        })),
      },
    },
  }
  const options = { new: true, runValidators: true }

  const branch = await this.findOneAndUpdate(conditions, update, options)

  return branch?.reviews?.filter((review) =>
    workspaceUserIds.find(workspaceUserId => review.workspaceUser.equals(workspaceUserId)))
}

ProjectBranchSchema.statics.addReview = async function (
  id: string | ObjectId,
  workspaceUserId: string | ObjectId,
  payload: { state: ProjectBranchReviewState, thread?: string | ObjectId },
) {
  const conditions = {
    _id: id,
    'reviews.workspaceUser': {
      $ne: new ObjectId(workspaceUserId),
    },
  }
  const update = {
    $push: {
      reviews: {
        workspaceUser: new ObjectId(workspaceUserId),
        ...payload,
      },
    },
  }
  const options = { new: true, runValidators: true }

  const branch = await this.findOneAndUpdate(conditions, update, options)

  return branch?.reviews?.find((review) =>
    review.workspaceUser.equals(workspaceUserId))
}

ProjectBranchSchema.statics.updateReview = async function (
  id: string | ObjectId,
  workspaceUserId: string | ObjectId,
  payload: object,
) {
  const _payload = MongoPayload.prependToKeys(payload, 'reviews.$')

  const conditions = {
    _id: new ObjectId(id),
    'reviews.workspaceUser': new ObjectId(workspaceUserId),
  }
  const update = {
    $set: _payload,
  }

  const options = { new: true, runValidators: true }

  const branch = await this.findOneAndUpdate(conditions, update, options)

  return branch.reviews.find((review) => review.workspaceUser.equals(workspaceUserId))
}

ProjectBranchSchema.statics.removeReview = function (
  id: string | ObjectId,
  workspaceUserId: string | ObjectId,
) {
  const conditions = {
    _id: new ObjectId(id),
    'reviews.workspaceUser': new ObjectId(workspaceUserId),
  }
  const update = {
    $pull: {
      reviews: {
        workspaceUser: new ObjectId(workspaceUserId),
      },
    },
  }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(conditions, update, options)
}

ProjectBranchSchema.statics.getProjectBranchesInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IProjectBranch>,
) {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

ProjectBranchSchema.statics.deleteProjectBranchesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ProjectBranchSchema.statics.deleteProjectBranchesByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

// allow single default branch per project
ProjectBranchSchema.index(
  { project: 1, default: 1 },
  {
    unique: true,
    partialFilterExpression: {
      default: {
        $eq: true,
      },
      archived: {
        $ne: true,
      },
    },
  },
)

ProjectBranchSchema.index({
  default: 1,
  project: 1,
  workspace: 1,
  _id: 1,
})

// require uniq brnach name in single project if branch is active (not merged)
ProjectBranchSchema.index(
  {
    project: 1,
    name: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          ProjectBranchStatus.TO_REVIEW,
          ProjectBranchStatus.CHANGE_REQUESTED,
          ProjectBranchStatus.IN_PROGRESS,
          ProjectBranchStatus.APPROVED,
          ProjectBranchStatus.DRAFT,
        ],
      },
    },
  },
)

ProjectBranchSchema.index({ name: 'text' })

export const ProjectBranchModel = mongoose.model<IProjectBranchDocument, IProjectProjectBranchModel>('Project-Branch', ProjectBranchSchema)
