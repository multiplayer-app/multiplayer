import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IWorkspace,
  IWorkspaceMember,
  IWorkspaceBilling,
  IWorkspaceSettings,
  ICursor,
  DataWithCursor,
  WorkspaceBillingFeatures,
  IAccess,
} from '@multiplayer/types'
import { SortOrder } from '../types'
import { SKIP, LIMIT } from '../config'
import { FeatureFlag } from '@multiplayer/types'

const { Schema } = mongoose

export interface IWorkspaceDocument extends Omit<IWorkspace, '_id'>, Document {
  _id: ObjectId

  toObject(): IWorkspaceDocument
}

export interface IWorkspaceModel extends Model<IWorkspaceDocument> {
  createWorkspace(
    payload: object
  ): Promise<IWorkspaceDocument>

  findWorkspaceById(
    id: string | ObjectId,
    project?: any
  ): Promise<IWorkspaceDocument | undefined>

  getWorkspaceBillingById(
    id: string | ObjectId
  ): Promise<IWorkspaceBilling | undefined>

  getWorkspaceBySubscriptionId(
    subscriptionId: string | ObjectId
  ): Promise<IWorkspaceDocument | undefined>

  updateWorkspaceBySubscriptionId(
    subscriptionId: string | ObjectId,
    payload: Partial<Omit<IWorkspace, 'billing'> & { billing: Partial<IWorkspaceBilling> }>
  ): Promise<IWorkspaceDocument | undefined>

  findWorkspacesByDomain(
    domain: string,
    filter?: { domainAutoJoin?: boolean },
  ): Promise<Array<IWorkspaceDocument>>

  findWorkspaces(
    filter: {
      _id?: string | ObjectId | string[] | ObjectId[],
      archived?: boolean,
      workspaceUsers?: string[] | ObjectId[],
      text?: string,
    },
    cursor?: ICursor,
    sort?: {
      sortKey: string,
      sortDirection: SortOrder,
    },
  ): Promise<DataWithCursor<IWorkspaceDocument>>

  updateWorkspaceById(
    id: string | ObjectId,
    payload: Partial<Omit<IWorkspace, 'billing'> & { billing: Partial<IWorkspaceBilling> }>
  ): Promise<IWorkspaceDocument | undefined>

  updateWorkspaceFeatureAccessById(
    id: string | ObjectId,
    flag: FeatureFlag,
    enabled: boolean
  ): Promise<IWorkspaceDocument | undefined>

  deleteWorkspaceById(id: string | ObjectId): Promise<void>

  listUsers(
    id: string | ObjectId,
    cursor?: ICursor
  ): Promise<DataWithCursor<IWorkspaceMember>>

  getWorkspaceMembersByWorkspaceUserIds(
    workspaceId: string | ObjectId,
    workspaceUserIds: Array<string | ObjectId>,
  ): Promise<Array<IWorkspaceMember>>

  getWorkspaceMembersByWorkspaceMemberIds(
    workspaceId: string | ObjectId,
    workspaceMemberIds: Array<string | ObjectId>,
  ): Promise<Array<IWorkspaceMember>>

  getWorkspaceByWorkspaceUserId(
    workspaceId: string | ObjectId,
    workspaceUserId: string | ObjectId,
  ): Promise<IWorkspaceDocument>

  addUsers(
    id: string | ObjectId,
    workspaceUserIds: Array<string | ObjectId>,
    role: string | ObjectId,
  ): Promise<Array<IWorkspaceMember>>

  updateUser(
    id: string | ObjectId,
    workspaceMemberId: string | ObjectId,
    payload: object
  ): Promise<IWorkspaceMember | undefined>

  removeUser(
    id: string | ObjectId,
    workspaceMemberId: string | ObjectId
  ): Promise<void>

  addDomain(
    id: string | ObjectId,
    domain: string,
  ): Promise<IWorkspaceDocument | undefined>

  removeDomain(
    id: string | ObjectId,
    workspaceDomainId: string | ObjectId,
  ): Promise<IWorkspaceDocument | undefined>

  deleteWorkspaceByIds(ids: Array<string | ObjectId>): Promise<void>

  increaseAiRequestsCounter(
    id: string | ObjectId,
  ): Promise<IWorkspaceMember | undefined>

  hasFeatureAccess(workspaceId: string | ObjectId, flag: FeatureFlag): Promise<boolean>

  findWorkspaceWithWorkspaceUserAndRole(
    workspaceId: string | ObjectId,
    workspaceUserId: string | ObjectId,
    roleId: string | ObjectId,
  ): Promise<IWorkspaceDocument | undefined>

  findWorkspaceWithWorkspaceMemberAndRole(
    workspaceId: string | ObjectId,
    workspaceMemberId: string | ObjectId,
    roleId: string | ObjectId,
  ): Promise<IWorkspaceDocument | undefined>

  countWorkpsacesForAccount(
    accountId: string | ObjectId,
  ): Promise<number>

  updateWorkspaceAccess(
    id: string | ObjectId,
    payload: Partial<IAccess>
  ): Promise<IAccess | undefined>

  getWorkspaceSettings(
    id: string | ObjectId,
  ): Promise<IWorkspaceSettings | undefined>
}

const WorkspaceMemberSchema = new Schema({
  workspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User',
    required: true,
    index: true,
  },
  role: {
    type: ObjectId,
    ref: 'Role',
    required: true,
  },
}, {
  timestamps: false,
})

const WorkspaceDomainSchema = new Schema({
  domain: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
})

const WorkspaceFeatureFlagsSchema = new Schema(
  Object.keys(FeatureFlag).reduce((acc, flag) => {
    acc[flag] = {
      type: Boolean,
    }
    return acc
  }, {}),
  { timestamps: false, _id: false },
)

const WorkspaceSettingsSchema = new Schema({
  memberProjectAccess: {
    enabled: {
      type: Boolean,
      default: true,
    },
    projectRoleId: {
      type: ObjectId,
      ref: 'Role',
    },
  },
  domainAutoJoin: {
    enabled: {
      type: Boolean,
      default: false,
    },
    workspaceRoleId: {
      type: ObjectId,
      ref: 'Role',
      default: null,
    },
  },
}, { timestamps: false, _id: false })

const WorkspaceSchema = new Schema({
  account: {
    type: ObjectId,
    ref: 'Account',
    required: true,
    index: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  iconUrl: {
    type: String,
  },
  handle: {
    type: String,
    required: true,
  },
  domains: [WorkspaceDomainSchema],
  users: [WorkspaceMemberSchema],
  billing: {
    aiRequests: {
      type: Number,
    },
    stripe: {
      subscriptionId: {
        type: String,
        index: true,
      },
      trialEndsAt: {
        type: Date,
      },
      paidAtLeastOneTime: {
        type: Boolean,
      },
      productName: {
        type: String,
      },
      features: [{
        name: {
          type: String,
          enum: Object.values(WorkspaceBillingFeatures),
        },
        metadata: {
          count: {
            type: Number,
          },
          unlimited: {
            type: Boolean,
          },
          enabled: {
            type: Boolean,
          },
        },
      }],
    },
  },
  featureFlags: WorkspaceFeatureFlagsSchema,
  settings: {
    type: WorkspaceSettingsSchema,
    default: () => ({}),
  },
  isWorkspaceOnboarded: {
    type: Boolean,
    default: false,
  },
  finishedCopyingSampleData: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

WorkspaceSchema.statics.createWorkspace = function (payload: object) {
  return new this(payload).save()
}

WorkspaceSchema.statics.findWorkspaceById = function (
  id: string | ObjectId,
  project?: any,
) {
  const _project = { ...project || {} }

  if (
    Object.keys(_project).length
    && !Object.values(_project).find(projectValue => projectValue === 1)
    && !Object.keys(_project).find(key => key.startsWith('billing'))
  ) {
    _project['billing.stripe.subscriptionId'] = 0
  }

  return this.findOne(
    { _id: id },
    _project,
  )
}

WorkspaceSchema.statics.getWorkspaceBillingById = async function (id: string | ObjectId) {
  const workspace = await this.findOne(
    { _id: id },
  )

  return workspace?.billing
}

WorkspaceSchema.statics.getWorkspaceBySubscriptionId = async function (
  subscriptionId: string | ObjectId,
) {
  const workspace = await this.findOne({
    'billing.stripe.subscriptionId': subscriptionId,
  })

  return workspace
}

WorkspaceSchema.statics.updateWorkspaceBySubscriptionId = async function (
  subscriptionId: string | ObjectId,
  payload: Partial<Omit<IWorkspace, 'billing'> & { billing: Partial<IWorkspaceBilling> }>,
) {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    {
      'billing.stripe.subscriptionId': subscriptionId,
    },
    {
      $set: set,
      $unset: unset,
    },
    {
      new: true,
      runValidators: true,
      projection: {
        billing: 0,
      },
    },
  )
}

WorkspaceSchema.statics.findWorkspacesByDomain = function (
  domain: string,
  filter?: { domainAutoJoin?: boolean },
) {
  const conditions: Record<string, unknown> = { 'domains.domain': domain }

  if (filter?.domainAutoJoin !== undefined) {
    conditions['settings.domainAutoJoin.enabled'] = filter.domainAutoJoin
  }

  return this.find(conditions, { 'billing.stripe.subscriptionId': 0 })
}

WorkspaceSchema.statics.findWorkspaces = async function (
  filter: {
    _id?: string | ObjectId | string[] | ObjectId[],
    archived?: boolean,
    workspaceUsers?: string[] | ObjectId[],
    text?: string,
  },
  cursor: ICursor = {},
  sort?: {
    sortKey: string,
    sortDirection: SortOrder,
  },
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

  if (filter.workspaceUsers) {
    conditions['users.workspaceUser'] = {
      $in: filter.workspaceUsers.map(workspaceUserId => new ObjectId(workspaceUserId)),
    }
  }

  if (filter._id) {
    conditions._id = Array.isArray(filter._id)
      ? { $in: filter._id.map(_id => new ObjectId(_id)) }
      : new ObjectId(filter._id)
  }

  if (filter.text) {
    conditions.$or = [
      {
        name: {
          $regex: new RegExp(filter.text, 'i'),
        },
      },
      {
        handle: {
          $regex: new RegExp(filter.text, 'i'),
        },
      },
    ]
  }

  const pipeline: any[] = [
    {
      $match: {
        ...conditions,
      },
    },
  ]

  if (sort?.sortKey) {
    pipeline.push({
      $sort: {
        [sort.sortKey]: sort.sortDirection,
      },
    })
  }

  pipeline.push({
    $facet: {
      count: [{ $count: 'count' }],
      items: [
        { $skip: cursor.skip },
        { $limit: cursor.limit },
        { $unset: 'users' },
        { $unset: 'billing.stripe.subscriptionId' },
      ],
    },
  })

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

WorkspaceSchema.statics.updateWorkspaceById = function (
  id: string | ObjectId,
  payload: object,
) {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: set,
      $unset: unset,
    },
    {
      new: true,
      runValidators: true,
      projection: {
        billing: 0,
      },
    },
  )
}

WorkspaceSchema.statics.updateWorkspaceFeatureAccessById = function (
  id: string | ObjectId,
  flag: FeatureFlag,
  enabled: boolean,
): Promise<IWorkspaceDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        [`featureFlags.${flag}`]: enabled,
      },
    },
    {
      new: true,
      runValidators: true,
      projection: {
        billing: 0,
      },
    },
  )
}

WorkspaceSchema.statics.deleteWorkspaceById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

WorkspaceSchema.statics.hasFeatureAccess = async function (workspaceId: string | ObjectId, flag: FeatureFlag): Promise<boolean> {
  const workspace = await this.findOne({
    _id: workspaceId,
    [`featureFlags.${flag}`]: true,
  })
  return !!workspace
}

WorkspaceSchema.statics.listUsers = async function (
  id: string | ObjectId,
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const pipeline = [{
    $match: {
      _id: new ObjectId(id),
    },
  }, {
    $unwind: '$users',
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
            localField: 'users.workspaceUser',
            foreignField: '_id',
            as: 'users.workspaceUser',
          },
        }, {
          $unwind: '$users.workspaceUser',
        }, {
          $replaceRoot: {
            newRoot: '$users',
          },
        }, {
          $lookup: {
            from: 'users',
            localField: 'workspaceUser.user',
            foreignField: '_id',
            as: 'workspaceUser.user',
          },
        }, {
          $unwind: '$workspaceUser.user',
        }, {
          $set: {
            'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
          },
        }, {
          $unset: ['workspaceUser.user'],
        },
      ],
    },
  }]

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

WorkspaceSchema.statics.getWorkspaceMembersByWorkspaceUserIds = async function (
  workspaceId: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(workspaceId),
    },
  }, {
    $unwind: '$users',
  }, {
    $match: {
      'users.workspaceUser': {
        $in: workspaceUserIds.map(_id => new ObjectId(_id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: 'users.workspaceUser',
      foreignField: '_id',
      as: 'users.workspaceUser',
    },
  }, {
    $unwind: '$users.workspaceUser',
  }, {
    $replaceRoot: {
      newRoot: '$users',
    },
  }, {
    $lookup: {
      from: 'users',
      localField: 'workspaceUser.user',
      foreignField: '_id',
      as: 'workspaceUser.user',
    },
  }, {
    $unwind: '$workspaceUser.user',
  }, {
    $set: {
      'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
    },
  }]

  return this.aggregate(pipeline)
}

WorkspaceSchema.statics.getWorkspaceMembersByWorkspaceMemberIds = async function (
  workspaceId: string | ObjectId,
  workspaceMemberIds: Array<string | ObjectId>,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(workspaceId),
    },
  }, {
    $unwind: '$users',
  }, {
    $match: {
      'users._id': {
        $in: workspaceMemberIds.map(_id => new ObjectId(_id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: 'users.workspaceUser',
      foreignField: '_id',
      as: 'users.workspaceUser',
    },
  }, {
    $unwind: '$users.workspaceUser',
  }, {
    $replaceRoot: {
      newRoot: '$users',
    },
  }, {
    $lookup: {
      from: 'users',
      localField: 'workspaceUser.user',
      foreignField: '_id',
      as: 'workspaceUser.user',
    },
  }, {
    $unwind: '$workspaceUser.user',
  }, {
    $set: {
      'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
    },
  }]

  return this.aggregate(pipeline)
}

WorkspaceSchema.statics.getWorkspaceByWorkspaceUserId = async function (
  workspaceId: string | ObjectId,
  workspaceUserId: string | ObjectId,
): Promise<IWorkspaceDocument> {
  return this.findOne({
    _id: workspaceId,
    'users.workspaceUser': workspaceUserId,
  })
}

WorkspaceSchema.statics.addUsers = async function (
  id: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
  role: string | ObjectId,
) {
  const filter = {
    _id: id,
    'users.workspaceUser': { $nin: workspaceUserIds },
  }
  const update = {
    $push: {
      users: {
        $each: workspaceUserIds.map((workspaceUserId) => ({
          workspaceUser: workspaceUserId,
          role,
        })),
      },
    },
  }
  const options = { new: true, runValidators: true }

  const workspace = await this.findOneAndUpdate(filter, update, options)

  const invitedWorkspaceMembers = workspace?.users
    .filter(({ workspaceUser }) => workspaceUserIds.find(workspaceUserId => workspaceUser.equals(workspaceUserId)))

  return invitedWorkspaceMembers || []
}

WorkspaceSchema.statics.updateUser = async function (
  id: string | ObjectId,
  workspaceMemberId: string | ObjectId,
  payload: object,
) {
  const _payload = MongoPayload.prependToKeys(payload, 'users.$')
  const filter = {
    _id: id,
    'users._id': workspaceMemberId,
  }
  const update = {
    $set: _payload,
  }
  const options = { new: true, runValidators: true }

  const workspace = await this.findOneAndUpdate(filter, update, options)

  const workspaceMember = workspace?.users.find(({ _id }) => _id.equals(workspaceMemberId))

  return workspaceMember
}

WorkspaceSchema.statics.removeUser = function (
  id: string | ObjectId,
  workspaceMemberId: string | ObjectId,
) {
  const filter = { _id: id }
  const update = { $pull: { users: { _id: workspaceMemberId } } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

WorkspaceSchema.statics.addDomain = async function (
  id: string | ObjectId,
  domain: string,
) {
  const filter = {
    _id: id,
    'domains.domain': { $ne: domain },
  }
  const update = { $push: { domains: { domain } } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

WorkspaceSchema.statics.removeDomain = function (
  id: string | ObjectId,
  workspaceDomainId: string | ObjectId,
) {
  const filter = { _id: id }
  const update = {
    $pull: {
      domains: {
        _id: new ObjectId(workspaceDomainId),
      },
    },
  }
  const options = {
    new: true,
    runValidators: true,
    projection: {
      billing: 0,
    },
  }

  return this.findOneAndUpdate(filter, update, options)
}

WorkspaceSchema.statics.deleteWorkspaceByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

WorkspaceSchema.statics.findWorkspaceWithWorkspaceUserAndRole = function (
  workspaceId: string | ObjectId,
  workspaceUserId: string | ObjectId,
  roleId: string | ObjectId,
) {
  return this.findOne({
    _id: new ObjectId(workspaceId),
    users: {
      $elemMatch: {
        workspaceUser: new ObjectId(workspaceUserId),
        role: new ObjectId(roleId),
      },
    },
  })
}

WorkspaceSchema.statics.findWorkspaceWithWorkspaceMemberAndRole = function (
  workspaceId: string | ObjectId,
  workspaceMemberId: string | ObjectId,
  roleId: string | ObjectId,
) {
  return this.findOne({
    _id: new ObjectId(workspaceId),
    users: {
      $elemMatch: {
        _id: new ObjectId(workspaceMemberId),
        role: new ObjectId(roleId),
      },
    },
  })
}

WorkspaceSchema.statics.countWorkpsacesForAccount = function (
  accountId: string | ObjectId,
): Promise<number> {
  return this.countDocuments({
    account: accountId,
  })
}

WorkspaceSchema.statics.updateWorkspaceAccess = async function (
  id: string | ObjectId,
  payload: Partial<IAccess>,
): Promise<IAccess | undefined> {
  const _payload = MongoPayload.prependToKeys(MongoPayload.flattenObject(payload), 'access')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const { access } = await this.findOneAndUpdate(
    {
      _id: id,
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

  return access
}

WorkspaceSchema.statics.getWorkspaceSettings = async function (
  id: string | ObjectId,
): Promise<IWorkspaceSettings | undefined> {
  const workspace = await this.findOne({ _id: id }, { settings: 1 })
  return workspace?.settings
}

WorkspaceSchema.statics.increaseAiRequestsCounter = function (
  id: string | ObjectId,
) {
  const filter = { _id: id }
  const update = {
    $inc: {
      'billing.aiRequests': 1,
    },
  }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

export const WorkspaceModel = mongoose.model<IWorkspaceDocument, IWorkspaceModel>('Workspace', WorkspaceSchema)
