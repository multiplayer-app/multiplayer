import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IFlowMetadata,
  ICursor,
  DataWithCursor,
  ITag,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { TagSchema } from './shared/tag.model'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IFlowMetadataDocument extends Omit<IFlowMetadata, '_id'>, Document {
  _id: ObjectId

  toObject(): IFlowMetadataDocument
  toJSON(): IFlowMetadata
}

export interface IFlowMetaModel extends Model<IFlowMetadataDocument> {
  countFlowsMetadata(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
    },
  ): Promise<number>

  createFlowMetadata(
    payload: Partial<IFlowMetadata>
  ): Promise<IFlowMetadataDocument>

  findFlowMetadataByRootSpanId(
    rootSpanId: string
  ): Promise<IFlowMetadataDocument | undefined>

  findFlowMetadataById(
    id: string
  ): Promise<IFlowMetadataDocument | undefined>

  findFlowMetadataByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IFlowMetadataDocument | undefined>

  findFlowsMetadata(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      name?: string,
      componentNames?: string | string[],
      environmentNames?: string[],
      platformIds?: string[] | ObjectId[],
      tags?: ITag[]
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IFlowMetadataDocument>>

  updateFlowMetadataById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string,
    payload: Partial<IFlowMetadata>
  ): Promise<IFlowMetadataDocument | undefined>

  addFlowMetadataStarById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    starId: string | ObjectId,
  ): Promise<IFlowMetadataDocument | undefined>

  removeFlowMetadataStarById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    starId: string | ObjectId,
  ): Promise<IFlowMetadataDocument | undefined>

  deleteFlowsMetadataByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteFlowsMetadataByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    _id?: string[] | ObjectId[],
  ): Promise<void>

  deleteFlowMetadataById(
    id: string | ObjectId,
  ): Promise<void>

  getUniqueTags(
    filter: {
      workspaceId: string | ObjectId,
      projectId: string | ObjectId,
    }
  ): Promise<string[]>
}

const FlowMetadataSchema = new Schema({
  id: {
    type: String,
    unique: true,
  },
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
  // environmentName: {
  //   type: String,
  // },
  // entityPlatformId: {
  //   type: ObjectId,
  // },
  name: {
    type: String,
  },
  tags: [TagSchema],
  starredSpanIds: [{
    type: String,
  }],
  platformIds: [{
    type: ObjectId,
  }],
  environmentNames: [{
    type: String,
  }],
  componentNames: [{
    type: String,
  }],
  rootSpanId: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
}, {
  timestamps: true,
})

FlowMetadataSchema.statics.countFlowsMetadata = function(
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
  },
): Promise<number> {
  return this.countDocuments({
    workspace: filter.workspace,
    project: filter.project,
  })
}

FlowMetadataSchema.statics.createFlowMetadata = function (
  payload: Partial<IFlowMetadata>,
) {
  return this.findOneAndUpdate(
    {
      id: payload.id,
    },
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

FlowMetadataSchema.statics.findFlowMetadataByRootSpanId = function (rootSpanId: string) {
  return this.findOne({ rootSpanId })
}

FlowMetadataSchema.statics.findFlowMetadataById = function (id: string) {
  return this.findOne({ id })
}

FlowMetadataSchema.statics.findFlowMetadataByIdAndProjectAndWorkspace = function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    id,
    workspace: workspaceId,
    project: projectId,
  })
}

FlowMetadataSchema.statics.findFlowsMetadata = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    name?: string,
    componentNames?: string | string[],
    environmentNames?: string | string[],
    platformIds?: string | ObjectId | string[] | ObjectId[],
    tags?: ITag[]
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort.id = -1
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (filter.name) {
    conditions.name = {
      $regex: new RegExp(filter.name, 'i'),
    }
  }

  if (filter.componentNames) {
    conditions.componentNames = Array.isArray(filter.componentNames)
      ? { $in: filter.componentNames }
      : filter.componentNames
  }

  if (filter.environmentNames) {
    conditions.environmentNames = Array.isArray(filter.environmentNames)
      ? { $in: filter.environmentNames }
      : filter.environmentNames
  }

  if (filter.platformIds) {
    conditions.platformIds = Array.isArray(filter.platformIds)
      ? { $in: filter.platformIds.map(id => new ObjectId(id)) }
      : new ObjectId(filter.platformIds)
  }

  if (filter.tags?.length) {
    conditions.tags = {
      $all: filter.tags.map(tag => ({
        $elemMatch: {
          ...tag.key? { key: tag.key } : {},
          value: tag.value,
        },
      })),
    }
  }

  const pipeline = [
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          { $skip: cursor.skip },
          { $limit: cursor.limit },
        ],
      },
    },
  ]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

FlowMetadataSchema.statics.updateFlowMetadataById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string,
  payload: Partial<IFlowMetadata>,
): Promise<IFlowMetadataDocument | undefined> {
  const {
    environmentNames,
    platformIds,
    ..._payload
  } = payload

  const updateQuery: any = {
    $set: _payload,
  }

  if (environmentNames?.length) {
    updateQuery.$addToSet = {
      environmentNames: {
        $each: environmentNames,
      },
    }
  }

  if (platformIds?.length) {
    updateQuery.$addToSet = {
      ...(updateQuery.$addToSet || {}),
      platformIds: {
        $each: platformIds,
      },
    }
  }

  return this.findOneAndUpdate(
    {
      id,
      workspace: workspaceId,
      project: projectId,
    },
    updateQuery,
    {
      new: true,
      runValidators: true,
    },
  )
}

FlowMetadataSchema.statics.addFlowMetadataStarById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  starId: string | ObjectId,
): Promise<IFlowMetadataDocument | undefined> {
  const conditions = {
    id,
    workspace: workspaceId,
    project: projectId,
  }

  return this.findOneAndUpdate(
    conditions,
    {
      $addToSet: {
        starred: starId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

FlowMetadataSchema.statics.removeFlowMetadataStarById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  starId: string | ObjectId,
): Promise<IFlowMetadataDocument | undefined> {
  const conditions = {
    id,
    workspace: workspaceId,
    project: projectId,
  }

  return this.findOneAndUpdate(
    conditions,
    {
      $pull: {
        starred: starId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

FlowMetadataSchema.statics.deleteFlowsMetadataByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

FlowMetadataSchema.statics.deleteFlowsMetadataByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  _id?: string[] | ObjectId[],
): Promise<void> {
  const conditions: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    _id?: { $in: string[] | ObjectId[] },
  } = {
    workspace: workspaceId,
    project: projectId,
  }

  if (_id?.length) {
    conditions._id = { $in: _id.map(id => new ObjectId(id)) }
  }

  return this.deleteMany(conditions)
}

FlowMetadataSchema.statics.deleteFlowMetadataById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    id,
  })
}

FlowMetadataSchema.statics.getUniqueTags = async function (filter: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
}): Promise<string[]> {
  const pipeline = [
    {
      $match: {
        workspace: new ObjectId(filter.workspaceId),
        project: new ObjectId(filter.projectId),
      },
    },
    { $unwind: '$tags' },
    { $group: { _id: null, tags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, tags: 1 } },
  ]

  const [{ tags } = { tags: [] }] = await this.aggregate(pipeline)

  return tags
}

FlowMetadataSchema.index({
  workspace: 1,
  project: 1,
})

export const FlowMetadataModel = mongoose.model<IFlowMetadataDocument, IFlowMetaModel>('Flow-Metadata', FlowMetadataSchema)
