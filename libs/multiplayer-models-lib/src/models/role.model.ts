import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IRole,
  ICursor,
  DataWithCursor,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleType,
  RoleAccessAction,
  RoleAccountPermissionEntity,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IRoleDocument extends Omit<IRole, '_id'>, Document {
  _id: ObjectId

  toObject(): IRole
  toJSON(): IRole
}

export interface IRoleModel extends Model<IRoleDocument> {
  createRole(payload: object): Promise<IRoleDocument>

  findRoleById(
    id: string | ObjectId,
    type?: RoleType
  ): Promise<IRoleDocument | undefined>

  findRoleByIds(
    ids: string[] | ObjectId[],
    type?: RoleType
  ): Promise<IRoleDocument[]>

  findRoles(
    filter: {
      type: RoleType
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<IRoleDocument>>

  getAllRoles(type: RoleType): Promise<IRoleDocument[]>

  findDefaultRole(type: RoleType): Promise<IRoleDocument>

  findReadOnlyRole(type: RoleType): Promise<IRoleDocument>

  findWorkspaceOwnerRole(): Promise<IRoleDocument>

  findWorkspaceAdminRole(): Promise<IRoleDocument>

  updateRoleById(
    id: string | ObjectId,
    payload: object
  ): Promise<IRoleDocument | undefined>

  deleteRoleById(id: string | ObjectId): Promise<void>

  deleteRoleByIds(ids: Array<string | ObjectId>): Promise<void>
}

const RoleSchema = new Schema({
  default: {
    type: Boolean,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(RoleType),
    required: true,
  },
  workspaceOwner: {
    type: Boolean,
  },
  workspaceAdmin: {
    type: Boolean,
  },
  teamAdmin: {
    type: Boolean,
  },
  readOnly: {
    type: Boolean,
  },
  permissions: [{
    entity: {
      type: String,
      enum: [
        ...Object.values(RoleWorkspacePermissionEntity),
        ...Object.values(RoleProjectPermissionEntity),
        ...Object.values(RoleAccountPermissionEntity),
      ],
    },
    access: [{
      type: String,
      enum: Object.values(RoleAccessAction),
    }],
  }],
}, {
  timestamps: true,
})

RoleSchema.statics.createRole = function (payload: Partial<IRole>) {
  return new this(payload).save()
}

RoleSchema.statics.findRoleById = function (
  id: string | ObjectId,
  type?: RoleType,
) {
  const conditions: any = {
    _id: new ObjectId(id),
  }

  if (type) {
    conditions.type = type
  }

  return this.findOne(conditions)
}

RoleSchema.statics.findRoleByIds = function (
  ids: string[] | ObjectId[],
  type?: RoleType,
): Promise<IRoleDocument[]> {
  const conditions: any = {
    _id: ids.map(id => new ObjectId(id)),
  }

  if (type) {
    conditions.type = type
  }

  return this.find(conditions)
}

RoleSchema.statics.findRoles = async function (
  filter: {
    type?: RoleType
  } = {},
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {
    $and: [],
  }

  if (!filter.type || filter.type !== RoleType.ACCOUNT) {
    conditions.$and.push({
      type: {
        $ne: RoleType.ACCOUNT,
      },
    })
  }

  if (filter.type) {
    conditions.$and.push({
      type: {
        $eq: filter.type,
      },
    })
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

RoleSchema.statics.getAllRoles = function (type: RoleType) {
  return this.find({
    type,
  })
}

RoleSchema.statics.findDefaultRole = function (type: RoleType) {
  return this.findOne({
    type,
    default: true,
  })
}

RoleSchema.statics.findReadOnlyRole = function (type: RoleType) {
  return this.findOne({
    type,
    readOnly: true,
  })
}

RoleSchema.statics.findWorkspaceOwnerRole = function () {
  return this.findOne({
    workspaceOwner: true,
  })
}

RoleSchema.statics.findWorkspaceAdminRole = function () {
  return this.findOne({
    workspaceAdmin: true,
  })
}

RoleSchema.statics.findRootRole = function () {
  return this.findOne({
    type: RoleType.ACCOUNT,
  })
}

RoleSchema.statics.updateRoleById = function (
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

RoleSchema.statics.deleteRoleById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

RoleSchema.statics.deleteRoleByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

RoleSchema.index({
  type: 1,
  default: 1,
}, {
  unique: true,
  partialFilterExpression: {
    default: {
      $eq: true,
    },
  },
})

RoleSchema.index({
  type: 1,
  workspaceOwner: 1,
}, {
  unique: true,
  partialFilterExpression: {
    workspaceOwner: true,
    type: RoleType.WORKSPACE,
  },
})

export const RoleModel = mongoose.model<IRoleDocument, IRoleModel>('Role', RoleSchema)
