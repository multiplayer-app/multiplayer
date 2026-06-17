import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IPlatformRelation,
  ICursor,
  DataWithCursor,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { LIMIT, SKIP } from '../config'

const { Schema } = mongoose

export interface IPlatformRelationDocument extends Omit<IPlatformRelation, '_id'>, Document {
  _id: ObjectId
  toObject(): IPlatformRelationDocument
  toJSON(): IPlatformRelation
}

export interface IPlatformRelationModel extends Model<IPlatformRelationDocument> {
  createPlatformRelation(
    payload: Omit<IPlatformRelation, '_id'>
  ): Promise<IPlatformRelationDocument>
  findPlatformRelations(
    filter: {
      projectBranchId: string,
      parentEntityId: string,
      sourceEntityId?: string,
      targetEntityId?: string,
      withDeleted?: boolean
    },
    cursor?: ICursor,
    projectBranchTreeIds?: ObjectId[],
  ): Promise<DataWithCursor<IPlatformRelationDocument>>

  deletePlatformRelationByFilter(projectBranchId: string, filter: {
    _id?: string | ObjectId,
    parentEntityId?: string | ObjectId,
    sourceEntityId?: string | ObjectId,
    targetEntityId?: string | ObjectId,
    relatedTo?: string | ObjectId,
  }): Promise<void>

  getPlatformRelationsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IPlatformRelation>
  ): any

  deletePlatformRelationsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deletePlatformRelationsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deletePlatformRelationsByProjectBranch(
    projectBranchId: string | ObjectId,
  ): Promise<void>
}

const PlatformRelationSchema = new Schema({
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
  parentEntity: {
    type: ObjectId,
    ref: 'Entity',
    required: true,
  },
  sourceEntity: {
    type: ObjectId,
    ref: 'Entity',
    required: true,
  },
  targetEntity: {
    type: ObjectId,
    ref: 'Entity',
    required: true,
  },
  deleted: {
    type: Boolean,
  },
}, {
  timestamps: true,
})

PlatformRelationSchema.statics.createPlatformRelation = function (payload: Omit<IPlatformRelation, '_id'>) {
  return this.findOneAndUpdate(
    {
      workspace: payload.workspace,
      project: payload.project,
      projectBranch: payload.projectBranch,
      parentEntity: payload.parentEntity,
      sourceEntity: payload.sourceEntity,
      targetEntity: payload.targetEntity,
    },
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

PlatformRelationSchema.statics.createManyPlatformRelations = async function (data: {
  platformEntityId: string,
  workspaceId: string,
  projectId: string,
  branchId: string,
  edges: { source: string, target: string }[],
}) {
  return this.insertMany(data.edges.map((edge) => ({
    parentEntity: data.platformEntityId,
    workspace: data.workspaceId,
    project: data.projectId,
    projectBranch: data.branchId,
    sourceEntity: edge.source,
    targetEntity: edge.target,
  })), { ordered: false })
}

PlatformRelationSchema.statics.findPlatformRelations = async function (
  projectBranchId: ObjectId | string,
  filter: {
    projectBranchId: string,
    parentEntityId: string,
    sourceEntityId?: string,
    targetEntityId?: string,
    withDeleted?: boolean
  },
  cursor: ICursor = {},
): Promise<DataWithCursor<IPlatformRelationDocument>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT
  const conditions: any = {
    projectBranch: projectBranchId,
  }

  if (!filter?.withDeleted) {
    conditions.deleted = { $in: [null, false] }
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

PlatformRelationSchema.statics.deletePlatformRelationByFilter = function (
  projectBranchId: string,
  filter: {
    _id?: string | ObjectId,
    parentEntityId?: string | ObjectId,
    sourceEntityId?: string | ObjectId,
    targetEntityId?: string | ObjectId,
    relatedTo?: string | ObjectId,
  }): Promise<void> {
  const conditions: any[] = [{ projectBranch: new ObjectId(projectBranchId) }]
  if (filter._id) {
    conditions.push({ _id: new ObjectId(filter._id) })
  }
  if (filter.parentEntityId) {
    conditions.push({ parentEntity: new ObjectId(filter.parentEntityId) })
  }
  if (filter.sourceEntityId) {
    conditions.push({ sourceEntity: new ObjectId(filter.sourceEntityId) })
  }
  if (filter.targetEntityId) {
    conditions.push({ targetEntity: new ObjectId(filter.targetEntityId) })
  }
  if (filter.relatedTo) {
    conditions.push({ $or: [{
      targetEntity: new ObjectId(filter.targetEntityId),
    }, {
      sourceEntity: new ObjectId(filter.sourceEntityId),
    }] })
  }

  if (Object.keys(conditions).length === 0) {
    logger.error('Empty filter is not allowed for delete operation, request will be ignored')
    return Promise.resolve()
  }

  return this.deleteMany({ $and: conditions })
}

PlatformRelationSchema.statics.getPlatformRelationsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IPlatformRelation>,
): any {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

PlatformRelationSchema.statics.deletePlatformRelationsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

PlatformRelationSchema.statics.deletePlatformRelationsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

PlatformRelationSchema.statics.deletePlatformRelationsByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

PlatformRelationSchema.index({
  projectBranch: 1,
  parentEntity: 1,
  sourceEntity: 1,
  targetEntity: 1,
}, {
  unique: true,
})

export const PlatformRelationModel = mongoose.model<IPlatformRelationDocument, IPlatformRelationModel>('Platform-Relation', PlatformRelationSchema)
