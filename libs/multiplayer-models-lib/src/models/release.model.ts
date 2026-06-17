import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IRelease,
  ICursor,
  DataWithCursor,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IReleaseDocument extends Omit<IRelease, '_id' | 'entity'>, Document {
  _id: ObjectId

  entity: ObjectId | string

  toObject(): IRelease
  toJSON(): IRelease
}

export interface IReleaseModel extends Model<IReleaseDocument> {
  upsertRelease(
    payload: Partial<IReleaseDocument>
  ): Promise<IReleaseDocument>

  findReleaseById(
    id: string | ObjectId
  ): Promise<IReleaseDocument | undefined>

  findReleaseByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IReleaseDocument | undefined>

  findReleases(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      entity?: string | ObjectId,
      version?: string,
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IReleaseDocument>>

  updateReleaseById(
    id: string | ObjectId,
    payload: Partial<IRelease>
  ): Promise<IReleaseDocument | undefined>

  deleteReleaseById(id: string | ObjectId): Promise<void>

  deleteReleaseByIds(ids: Array<string | ObjectId>): Promise<void>

  getReleasesInWorkspaceCursor(
    workspaceId: string | ObjectId,
  ): any

  deleteReleasesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>
}

const ReleaseSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspaces',
    required: true,
  },
  project: {
    type: ObjectId,
    ref: 'Projects',
    required: true,
  },
  entity: {
    type: ObjectId,
    ref: 'Entities',
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  commitHash: {
    type: String,
    max: 40,
  },
  repositoryUrl: {
    type: String,
  },
  releaseNotes: {
    type: String,
  },
}, {
  timestamps: true,
})

ReleaseSchema.statics.upsertRelease = function (
  payload: Partial<IRelease>,
) {
  const {
    _id,
    releaseNotes,
    createdAt,
    updatedAt,
    ...filter
  } = payload

  return this.findOneAndUpdate(
    filter,
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

ReleaseSchema.statics.findReleaseById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

ReleaseSchema.statics.findReleaseByIdAndProjectAndWorkspace = function (
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

ReleaseSchema.statics.findReleases = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    entity?: string | ObjectId,
    version?: string,
  },
  cursor?: ICursor,
  sort?: ISortOptions,
) {
  const cursorOptions = {
    skip: cursor?.skip || SKIP,
    limit: cursor?.limit || LIMIT,
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (filter.entity) {
    conditions.entity = new ObjectId(filter.entity)
  }

  if (filter.version) {
    conditions.version = filter.version
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...sort
            ? [{ $sort: { [sort.sortKey]: sort.sortDirection } }]
            : [],
          { $skip: cursorOptions.skip },
          { $limit: cursorOptions.limit },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursorOptions.skip,
      limit: cursorOptions.limit,
    },
  }
}

ReleaseSchema.statics.updateReleaseById = function (
  id: string | ObjectId,
  payload: Partial<IRelease>,
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

ReleaseSchema.statics.deleteReleaseById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

ReleaseSchema.statics.deleteReleaseByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

ReleaseSchema.statics.getReleasesInWorkspaceCursor = function (
  workspaceId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
  }).sort({ _id: 1 }).cursor()
}

ReleaseSchema.statics.deleteReleasesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ReleaseSchema.index({
  workspace: 1,
  project: 1,
  entity: 1,
  version: 1,
}, {
  unique: true,
})

ReleaseSchema.index({
  workspace: 1,
  project: 1,
  entity: 1,
})

export const ReleaseModel = mongoose.model<IReleaseDocument, IReleaseModel>('Release', ReleaseSchema)
