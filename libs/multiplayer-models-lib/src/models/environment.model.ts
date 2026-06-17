import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IEnvironment,
  ICursor,
  DataWithCursor,
  SystemTag,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'
import { TagSchema } from './shared/tag.model'

const { Schema } = mongoose

export interface IEnvironmentDocument extends Omit<IEnvironment, '_id' | 'workspace' | 'project' | 'projectBranch' | 'createdAtCommit' | 'archivedAtCommit' | 'deletedAtCommit'>, Document {
  _id: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId | string

  createdAtCommit: ObjectId | string

  archivedAtCommit: ObjectId | string

  deletedAtCommit: ObjectId | string

  toObject(): IEnvironmentDocument
  toJSON(): IEnvironment
}

export interface IEnvironmentModel extends Model<IEnvironmentDocument> {
  createEnvironment(payload: object): Promise<IEnvironmentDocument>

  getEnvironmentById(
    environmentId: string | ObjectId,
    projectBranchId: string | ObjectId | string[] | ObjectId[],
  ): Promise<IEnvironmentDocument | undefined>

  findEnvironments(
    filter: object,
    cursor?: ICursor
  ): Promise<DataWithCursor<IEnvironmentDocument>>

  findEnvironmentByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IEnvironmentDocument | undefined>

  getEnvironmentState(
    projectBranchTreeIds: string[] | ObjectId[],
    filter?: Partial<IEnvironment> & {
      archived?: boolean
      withDeleted?: boolean
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IEnvironmentDocument>>

  updateEnvironmentById(
    environmentId: string | ObjectId,
    projectBranchId: string | ObjectId,
    payload: object
  ): Promise<IEnvironmentDocument | undefined>

  deleteEnvironment(
    id: string | ObjectId,
    projectBranchId: string | ObjectId,
  ): Promise<void>

  getEnvironmentsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): any

  deleteEnvironmentByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteEnvironmentByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deleteEnvironmentsByProjectBranch(
    projectBranchId: string | ObjectId,
  ): Promise<void>
}

const EnvironmentSchema = new Schema({
  environmentId: {
    type: ObjectId,
    required: true,
  },
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
  projectBranch: {
    type: ObjectId,
    ref: 'Project-Branch',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  tags: [TagSchema],
  systemTags: [{
    type: String,
    enum: Object.values(SystemTag),
  }],
  createdAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  archivedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  deletedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

EnvironmentSchema.statics.createEnvironment = function (
  payload: object,
) {
  return new this(payload).save()
}

EnvironmentSchema.statics.getEnvironmentById = async function (
  environmentId: string | ObjectId,
  projectBranchId: string | ObjectId | string[] | ObjectId[],
) {
  const [entity] = await this.find({
    environmentId: new ObjectId(environmentId),
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }).sort({
    _id: -1,
  }).limit(1)

  return entity
}

EnvironmentSchema.statics.findEnvironments = async function (
  filter: any,
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {}

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.projectBranch) {
    conditions.projectBranch = new ObjectId(filter.projectBranch)
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
      },
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          { $project: { _id: 0 } },
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

EnvironmentSchema.statics.updateEnvironmentById = function (
  environmentId: string | ObjectId,
  projectBranchId: string | ObjectId,
  payload: object,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)
  return this.findOneAndUpdate(
    {
      environmentId,
      projectBranch: projectBranchId,
    },
    {
      $set: set,
      $unset: unset,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

EnvironmentSchema.statics.findEnvironmentByIdAndProjectAndWorkspace = function(
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

EnvironmentSchema.statics.getEnvironmentState = async function(
  projectBranchTreeIds: string[] | ObjectId[],
  filter?: Partial<IEnvironment> & {
    archived?: boolean
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
): Promise<DataWithCursor<IEnvironment>> {
  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['_id'] = -1
  }

  const conditions: any = {
    projectBranch: {
      $in: projectBranchTreeIds.map(projectBranchId => new ObjectId(projectBranchId)),
    },
    deletedAtCommit: {
      $exists: false,
    },
  }

  if (mergeCommitId) {
    conditions.createdAtCommit = {
      $lt: new ObjectId(mergeCommitId),
    }
  }

  if (filter?.archived) {
    conditions.archivedAtCommit = { $exists: false }
  }

  if (filter?.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter?.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
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
          ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
          {
            $lookup: {
              from: 'tags',
              localField: 'tags',
              foreignField: '_id',
              as: 'tags',
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
      ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
      ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
    },
  }
}

EnvironmentSchema.statics.deleteEnvironment = function (
  entityId: string | ObjectId,
  projectBranchId: string | ObjectId,
) {
  return this.deleteOne({
    entityId,
    projectBranch: projectBranchId,
  })
}

EnvironmentSchema.statics.getEnvironmentsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

EnvironmentSchema.statics.deleteEnvironmentByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

EnvironmentSchema.statics.deleteEnvironmentByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

EnvironmentSchema.statics.deleteEnvironmentsByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

EnvironmentSchema.index({
  project: 1,
  projectBranch: 1,
  environmentId: 1,
}, {
  unique: true,
})

export const EnvironmentModel = mongoose.model<IEnvironment, IEnvironmentModel>('Environment', EnvironmentSchema)
