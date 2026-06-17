import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, Types } from 'mongoose'
import { DataWithCursor, ICursor, YjsUpdateStatus , BaseYjsUpdate } from '@multiplayer/types'

const { Schema } = mongoose

export interface EntityUpdateContext {
  workspace: string
  project: string
  projectBranch: string
  entityId: string
}


export type IEntityUpdate = EntityUpdateContext & BaseYjsUpdate

export interface IEntityUpdateDocument extends Omit<IEntityUpdate, '_id' | 'workspace' | 'project' | 'projectBranch' | 'entityId' | 'owner'>, Document {
  _id: Types.ObjectId
  workspace: Types.ObjectId
  project: Types.ObjectId
  projectBranch: Types.ObjectId
  entityId: Types.ObjectId
  owner: Types.ObjectId | undefined
  toObject(): IEntityUpdateDocument
  toJson(): IEntityUpdate
}

export interface IEntityUpdateModel extends Model<any> {
  getEntityUpdate(id: string | ObjectId): Promise<IEntityUpdateDocument>
  updateEntityUpdate(
    id: string | ObjectId,
    payload: Pick<IEntityUpdateDocument, 'status' | 'key' | 'bucket'>,
    unsetFields?: (keyof IEntityUpdate)[],
  ): Promise<IEntityUpdateDocument>
  createEntityUpdate(payload: Omit<IEntityUpdate, '_id' | 'createdAt'>): Promise<IEntityUpdateDocument>
  deleteEntityUpdate(id: string | ObjectId): Promise<void>
  deleteEntityUpdates(filter: EntityUpdateContext): Promise<void>
  deleteEntityUpdatesByWorkspace(workspace: string | Types.ObjectId): Promise<void>
  listEntityUpdates(filter: EntityUpdateContext, cursor: ICursor): Promise<DataWithCursor<IEntityUpdateDocument>>
  listEntityUpdatesGroups(filter: {
    workspace?: string | Types.ObjectId,
    project?: string | Types.ObjectId,
    projectBranch?: string | Types.ObjectId,
    entityId?: string | Types.ObjectId,
  }, cursor?: ICursor): Promise<DataWithCursor<EntityUpdateContext>>
  listBigUpdates(
    sizeMin: number,
    cursor: ICursor,
  ): Promise<DataWithCursor<{ bsonSize: number; _id: ObjectId }>>
  deleteEntityUpdatesByProjectBranch(projectBranchId: string | ObjectId): Promise<void>
}

const EntityUpdateSchema = new Schema({
  workspace: {
    type: Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  project: {
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  projectBranch: {
    type: Types.ObjectId,
    ref: 'Project-Branch',
    required: true,
  },
  entityId: {
    type: Types.ObjectId,
    ref: 'Entity',
    required: true,
  },
  owner: {
    type: Types.ObjectId,
    ref: 'Workspace-User',
    required: false,
  },
  update: {
    type: Buffer,
    required: false,
  },
  key: {
    type: String,
    required: false,
  },
  bucket: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: Object.values(YjsUpdateStatus),
    default: YjsUpdateStatus.DONE,
  },
}, { timestamps: true })

EntityUpdateSchema.statics.updateEntityUpdate = async function (
  id: string | ObjectId,
  payload: Pick<IEntityUpdateDocument, 'status' | 'key' | 'bucket'>,
  unsetFields?: (keyof IEntityUpdate)[],
): Promise<IEntityUpdateDocument> {
  const condition: any = {
    $set: {
      status: payload.status,
      key: payload.key,
      bucket: payload.bucket,
    },
  }
  if (unsetFields) {
    condition.$unset = unsetFields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {})
  }

  return this.updateOne({ _id: id }, condition)
}

EntityUpdateSchema.statics.getEntityUpdate = async function (id: string | ObjectId): Promise<IEntityUpdateDocument> {
  return this.findById(id)
}

EntityUpdateSchema.statics.createEntityUpdate = async function (payload: Omit<IEntityUpdate, '_id' | 'createdAt'>): Promise<IEntityUpdateDocument> {
  return new this(payload).save()
}

EntityUpdateSchema.statics.deleteEntityUpdate = async function (id: string | ObjectId): Promise<void> {
  return this.deleteOne({ _id: id })
}

EntityUpdateSchema.statics.deleteEntityUpdates = async function (filter: EntityUpdateContext): Promise<void> {
  const conditions = {
    workspace: filter.workspace,
    project: filter.project,
    projectBranch: filter.projectBranch,
    entityId: filter.entityId,
  }

  return this.deleteMany(conditions)
}

EntityUpdateSchema.statics.deleteEntityUpdatesByWorkspace = async function (workspace: string | Types.ObjectId): Promise<void> {
  return this.deleteMany({
    workspace,
  })
}

EntityUpdateSchema.statics.listEntityUpdates = async function (filter: EntityUpdateContext, cursor: ICursor = {}): Promise<DataWithCursor<IEntityUpdateDocument>> {
  const conditions = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    projectBranch: new ObjectId(filter.projectBranch),
    entityId: new ObjectId(filter.entityId),
    status: { $ne: YjsUpdateStatus.IN_PROGRESS },
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...cursor.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor.limit ? [{ $limit: cursor.limit }] : [],
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

EntityUpdateSchema.statics.listBigUpdates = async function (
  sizeMin: number,
  cursor: ICursor,
): Promise<DataWithCursor<{ bsonSize: number; _id: ObjectId }>> {
  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $project: {
        bsonSize: { $bsonSize: '$$ROOT' },
      },
    },
    {
      $match: { bsonSize: { $gte: sizeMin } },
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...cursor.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor.limit ? [{ $limit: cursor.limit }] : [],
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

EntityUpdateSchema.statics.listEntityUpdatesGroups = async function (filter: {
  workspace?: string | Types.ObjectId,
  project?: string | Types.ObjectId,
  projectBranch?: string | Types.ObjectId,
  entityId?: string | Types.ObjectId,
} = {}, cursor: ICursor = {}): Promise<DataWithCursor<EntityUpdateContext>> {
  const conditions: any = { status: { $ne: YjsUpdateStatus.IN_PROGRESS } }
  if (filter.workspace) conditions.workspace = new ObjectId(filter.workspace)
  if (filter.project) conditions.project = new ObjectId(filter.project)
  if (filter.projectBranch) conditions.projectBranch = new ObjectId(filter.projectBranch)
  if (filter.entityId) conditions.entityId = new ObjectId(filter.entityId)

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $sort: {
        workspace: 1,
        project: 1,
        projectBranch: 1,
        entityId: 1,
      },
    },
    {
      $group: {
        _id: {
          workspace: '$workspace',
          project: '$project',
          projectBranch: '$projectBranch',
          entityId: '$entityId',
        },
      },
    },
    { $replaceRoot: { newRoot: '$_id' } },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...cursor.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor.limit ? [{ $limit: cursor.limit }] : [],
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

EntityUpdateSchema.statics.deleteEntityUpdatesByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

EntityUpdateSchema.index({
  workspace: 1,
  project: 1,
  projectBranch: 1,
  entityId: 1,
})

EntityUpdateSchema.index({
  createdAt: 1,
}, {
  expireAfterSeconds: 3600,
  partialFilterExpression: {
    status: YjsUpdateStatus.IN_PROGRESS,
  },
})

export const EntityUpdateModel = mongoose.model<IEntityUpdateDocument, IEntityUpdateModel>('Entity-Update', EntityUpdateSchema)
