import { mongoose, encryption, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { Model } from 'mongoose'
import { DEFAULT_USER_TIMEZONE } from '../config'
import {
  IWorkspaceUser,
  ICursor,
  WorkspaceUserStatus,
  DataWithCursor,
} from '@multiplayer/types'

const { Schema } = mongoose

const colors = ['#FF4F00', '#ECA96F', '#EC6FA9', '#6FECA9']
const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)]
}

export interface IWorkspaceUserDocument extends Omit<IWorkspaceUser, '_id'>, Document {
  _id: ObjectId

  toObject(): IWorkspaceUserDocument
  toJSON(): IWorkspaceUser
}

export interface IWorkspaceUserModel extends Model<IWorkspaceUserDocument> {
  createWorkspaceUser(
    payload: object | Partial<IWorkspaceUser>
  ): Promise<IWorkspaceUserDocument>

  findWorkspaceUser(
    userId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IWorkspaceUserDocument | undefined>

  findWorkspaceUsersByUserId(
    userId: string | ObjectId,
    project?: object,
    filter?: { status?: WorkspaceUserStatus }
  ): Promise<IWorkspaceUserDocument[]>

  findWorkspaceUserById(
    workspaceUserId: string | ObjectId
  ): Promise<IWorkspaceUserDocument | undefined>

  findWorkspaceUserByIds(
    workspaceUserIds: string[] | ObjectId[]
  ): Promise<IWorkspaceUserDocument[]>

  findWorkspaceUsers(
    filters?: object,
    cursor?: ICursor
  ): Promise<DataWithCursor<IWorkspaceUserDocument>>

  updateWorkspaceUser(
    userId: string | ObjectId,
    workspaceId: string | ObjectId,
    payload: Partial<IWorkspaceUser>
  ): Promise<IWorkspaceUserDocument | undefined>

  removeWorkspaceUser(id: string | ObjectId): Promise<void>

  deleteWorkspaceUserByIds(
    ids: Array<string | ObjectId>
  ): Promise<void>

  deleteWorkspaceUsersByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>
}

const WorkspaceUserSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  username: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    require: true,
  },
  timezone: {
    type: String,
    require: true,
    default: DEFAULT_USER_TIMEZONE,
  },
  iconUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(WorkspaceUserStatus),
    require: true,
    default: WorkspaceUserStatus.PENDING,
  },
  googleWorkspaceToken: {
    refresh_token: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    expiry_date: {
      type: Number,
    },
    access_token: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    token_type: {
      type: String,
    },
    id_token: {
      type: String,
    },
    scope: {
      type: String,
    },
  },
}, {
  timestamps: true,
})

WorkspaceUserSchema.set('toJSON', {
  transform: function(doc, ret, opt) {
    delete ret.googleWorkspaceToken

    return ret
  },
})

WorkspaceUserSchema.statics.createWorkspaceUser = function (payload: object) {
  return new this({
    ...payload,
    color: getRandomColor(),
  }).save()
}

WorkspaceUserSchema.statics.findWorkspaceUser = function (
  userId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    user: userId,
    workspace: workspaceId,
  })
}

WorkspaceUserSchema.statics.findWorkspaceUsersByUserId = function(
  userId: string | ObjectId,
  project: object,
  filter?: { status?: WorkspaceUserStatus },
): Promise<IWorkspaceUserDocument[]> {
  const conditions: any = {
    user: userId,
  }

  if (filter?.status) {
    conditions.status = filter.status
  }

  return this.find(
    conditions,
    project || undefined,
  )
}

WorkspaceUserSchema.statics.findWorkspaceUserById = function (
  workspaceUserId: string | ObjectId,
): Promise<IWorkspaceUserDocument | undefined> {
  return this.findOne({
    _id: workspaceUserId,
  })
}
WorkspaceUserSchema.statics.findWorkspaceUserByIds = function (
  workspaceUserIds: string[] | ObjectId[],
): Promise<IWorkspaceUserDocument[]> {
  return this.find({
    _id: {
      $in: workspaceUserIds,
    },
  }).populate('user', 'primaryEmail firstName lastName username')
}

WorkspaceUserSchema.statics.findWorkspaceUsers = async function (
  filters: object,
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || 0
  cursor.limit = cursor.limit || 30

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...filters,
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

WorkspaceUserSchema.statics.updateWorkspaceUser = async function (
  userId: string | ObjectId,
  workspaceId: string | ObjectId,
  payload: Partial<IWorkspaceUser> & { googleWorkspaceToken: any },
) {
  const _payload = MongoPayload.flattenObject(payload)

  if (_payload?.['googleWorkspaceToken.access_token']) {
    _payload['googleWorkspaceToken.access_token'] = await encryption.encrypt(_payload['googleWorkspaceToken.access_token'])
  }

  if (_payload?.['googleWorkspaceToken.refresh_token']) {
    _payload['googleWorkspaceToken.refresh_token'] = await encryption.encrypt(_payload['googleWorkspaceToken.refresh_token'])
  }

  return this.findOneAndUpdate(
    {
      user: userId,
      workspace: workspaceId,
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

WorkspaceUserSchema.statics.removeWorkspaceUser = function (
  id: string | ObjectId,
) {
  const filter = { _id: id }

  return this.deleteOne(filter)
}

WorkspaceUserSchema.statics.deleteWorkspaceUserByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

WorkspaceUserSchema.statics.deleteWorkspaceUsersByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

WorkspaceUserSchema.index({
  user: 1,
  workspace: 1,
}, {
  unique: true,
})

export const WorkspaceUserModel = mongoose.model<IWorkspaceUserDocument, IWorkspaceUserModel>('Workspace-User', WorkspaceUserSchema)
