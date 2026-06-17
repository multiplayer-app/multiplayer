import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, Types } from 'mongoose'
import { BaseYjsUpdate, DataWithCursor, ICursor, YjsUpdateStatus } from '@multiplayer/types'
import { EntityUpdateContext } from './entity-update.model'

const { Schema } = mongoose

export interface SessionNotesContext {
  workspace: string
  project: string
  session: string
}

export type ISessionNotesUpdate = SessionNotesContext & BaseYjsUpdate

export interface ISessionNotesUpdateDocument extends Omit<ISessionNotesUpdate, '_id' | 'workspace' | 'project' | 'session' | 'owner'>, Document {
  _id: Types.ObjectId
  workspace: Types.ObjectId
  project: Types.ObjectId
  session: Types.ObjectId
  owner: Types.ObjectId | undefined
  toObject(): ISessionNotesUpdateDocument
  toJson(): ISessionNotesUpdate
}

export interface ISessionNotesUpdateModel extends Model<any> {
  getSessionNotesUpdate(id: string | ObjectId): Promise<ISessionNotesUpdateDocument>
  updateSessionNotesUpdate(
    id: string | ObjectId,
    payload: Pick<ISessionNotesUpdateDocument, 'status' | 'key' | 'bucket'>,
    unsetFields?: (keyof ISessionNotesUpdate)[],
  ): Promise<ISessionNotesUpdateDocument>
  createSessionNotesUpdate(payload: Omit<ISessionNotesUpdate, '_id' | 'createdAt'>): Promise<ISessionNotesUpdateDocument>
  deleteSessionNotesUpdate(id: string | ObjectId): Promise<void>
  deleteSessionNotesUpdates(filter: SessionNotesContext): Promise<void>
  deleteSessionNotesUpdatesByWorkspace(workspace: string | Types.ObjectId): Promise<void>
  listSessionNotesUpdates(filter: SessionNotesContext, cursor: ICursor): Promise<DataWithCursor<ISessionNotesUpdateDocument>>
  listSessionNoteUpdatesGroups(filter: {
    workspace?: string | Types.ObjectId,
    project?: string | Types.ObjectId,
    session?: string | Types.ObjectId,
  }, cursor: ICursor): Promise<DataWithCursor<SessionNotesContext>>
}

const SessionNotesUpdateSchema = new Schema({
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
  session: {
    type: Types.ObjectId,
    ref: 'Session',
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

SessionNotesUpdateSchema.statics.updateSessionNotesUpdate = async function (
  id: string | ObjectId,
  payload: Pick<ISessionNotesUpdateDocument, 'status' | 'key' | 'bucket'>,
  unsetFields?: (keyof ISessionNotesUpdate)[],
): Promise<ISessionNotesUpdateDocument> {
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

SessionNotesUpdateSchema.statics.getSessionNotesUpdate = async function (id: string | ObjectId): Promise<ISessionNotesUpdateDocument> {
  return this.findById(id)
}

SessionNotesUpdateSchema.statics.createSessionNotesUpdate = async function (payload: Omit<ISessionNotesUpdate, '_id' | 'createdAt'>): Promise<ISessionNotesUpdateDocument> {
  return new this(payload).save()
}

SessionNotesUpdateSchema.statics.deleteSessionNotesUpdate = async function (id: string | ObjectId): Promise<void> {
  return this.deleteOne({ _id: id })
}

SessionNotesUpdateSchema.statics.deleteSessionNotesUpdates = async function (filter: SessionNotesContext): Promise<void> {
  const conditions = {
    workspace: filter.workspace,
    project: filter.project,
    session: filter.session,
  }

  return this.deleteMany(conditions)
}

SessionNotesUpdateSchema.statics.deleteSessionNotesUpdatesByWorkspace = async function (workspace: string | Types.ObjectId): Promise<void> {
  return this.deleteMany({
    workspace,
  })
}

SessionNotesUpdateSchema.statics.listSessionNotesUpdates = async function (filter: SessionNotesContext, cursor: ICursor = {}): Promise<DataWithCursor<ISessionNotesUpdateDocument>> {
  const conditions = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    session: new ObjectId(filter.session),
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
SessionNotesUpdateSchema.statics.listSessionNoteUpdatesGroups = async function (filter: {
  workspace?: string | Types.ObjectId,
  project?: string | Types.ObjectId,
  session?: string | Types.ObjectId,
} = {}, cursor: ICursor = {}): Promise<DataWithCursor<SessionNotesContext>> {
  const conditions: any = { status: { $ne: YjsUpdateStatus.IN_PROGRESS } }
  if (filter.workspace) conditions.workspace = new ObjectId(filter.workspace)
  if (filter.project) conditions.project = new ObjectId(filter.project)
  if (filter.session) conditions.projectBranch = new ObjectId(filter.session)

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $sort: {
        workspace: 1,
        project: 1,
        session: 1,
      },
    },
    {
      $group: {
        _id: {
          workspace: '$workspace',
          project: '$project',
          session: '$session',
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

SessionNotesUpdateSchema.index({
  workspace: 1,
  project: 1,
  session: 1,
})

SessionNotesUpdateSchema.index({
  createdAt: 1,
}, {
  expireAfterSeconds: 3600,
  partialFilterExpression: {
    status: YjsUpdateStatus.IN_PROGRESS,
  },
})

export const SessionNotesUpdateModel = mongoose.model<ISessionNotesUpdateDocument, ISessionNotesUpdateModel>('Session-Notes-Update', SessionNotesUpdateSchema)
