import { mongoose, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { slugifyString } from '@multiplayer/util-shared'
import { Model } from 'mongoose'
import {
  IEndUser,
  ICursor,
  DataWithCursor,
  EndUserType,
  SessionRecordingNextRecordType,
  EndUserState,
  SessionRecordingMode,
} from '@multiplayer/types'
import { createHash } from 'crypto'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'
import { SessionRecordingOptionsSchema } from './shared/session-recording-options.model'

const { Schema } = mongoose

export interface IEndUserDocument extends Omit<IEndUser, '_id' | 'workspace' | 'project'>, Document {
  _id: ObjectId

  workspace: string | ObjectId

  project: string | ObjectId

  createdAt: Date

  updatedAt: Date

  toObject(): IEndUser
}

export interface IEndUserModel extends Model<IEndUserDocument> {
  getEndUserHash(
    payload: Partial<IEndUser>,
  ): string

  createEndUser(
    payload: Partial<IEndUser>
  ): Promise<IEndUserDocument>

  findEndUser(
    filter: {
      project: string | ObjectId,
      workspace: string | ObjectId,
      attributes: IEndUser['attributes']
    }
  ): Promise<IEndUserDocument | undefined>

  findEndUserByClientId(
    clientId: string,
  ): Promise<IEndUserDocument | undefined>

  findEndUsers(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,

      _id?: string[] | ObjectId[] | string | ObjectId,

      'attributes.type'?: string,
      'attributes.id'?: string,
      'attributes.name'?: string,
      'attributes.groupId'?: string,
      'attributes.groupName'?: string,
      'attributes.userEmail'?: string,
      'attributes.userId'?: string,
      'attributes.userName'?: string,
      'attributes.accountId'?: string,
      'attributes.accountName'?: string,
      'attributes.orgId'?: string,
      'attributes.orgName'?: string,

      'lastSeen.gte'?: string | Date,
      'lastSeen.lte'?: string | Date,

      online?: boolean,
      state?: EndUserState,

      text?: string,
    },
    cursor?: ICursor,
    sort?: ISortOptions,
    $project?: any
  ): Promise<DataWithCursor<IEndUserDocument>>

  findEndUserByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IEndUserDocument | undefined>

  removeEndUserById(
    id: string | ObjectId,
  ): Promise<void>

  deleteEndUsersByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteEndUsersByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  bulkDeleteEndUsersByIds(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    ids?: string[] | ObjectId[],
  ): Promise<void>

  updateConditionalRecordingSettings(
    id: string | ObjectId,
    payload: IEndUser['conditionalRecordingSettings']
  ): Promise<IEndUser['conditionalRecordingSettings'] | undefined>

  bulkUpdateRemoteSessionRecordingSettings(
    ids: string[] | ObjectId[],
    payload: IEndUser['conditionalRecordingSettings']
  ): Promise<(IEndUser['conditionalRecordingSettings'] | undefined)[]>

  upsertSocketIdToEndUserByHash(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    hash: string,
    socketId: string,
    state?: EndUserState,
  ): Promise<IEndUserDocument | undefined>

  upsertSocketIdToEndUserById(
    id: string | ObjectId,
    socketId: string,
    clientId?: string,
    state?: EndUserState,
  ): Promise<IEndUserDocument>

  disconnectEndUserBySocketId(
    socketId: string,
  ): Promise<void>

  findEndUsersBySocketId(
    socketId: string,
  ): Promise<IEndUserDocument[]>

  updateEndUserStateBySocketId(
    socketId: string,
    payload: {
      state: EndUserState,
      recordingMode?: SessionRecordingMode,
      sessionRecording?: string,
    }
  ): Promise<IEndUserDocument | undefined>

  getEndUsersWithConnectionsCursor(): any

  incrementSessionRecordingsCount(
    filter: {
      hash?: string,
      clientId?: string,
    }
  ): Promise<IEndUserDocument | undefined>
}

export const EndUserSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  hash: {
    type: String,
  },

  connections: [{
    socketId: {
      type: String,
      index: true,
    },
    clientId: {
      type: String,
    },
    state: {
      type: String,
      enum: Object.values(EndUserState),
    },
    recordingMode: {
      type: String,
      enum: Object.values(SessionRecordingMode),
    },
    sessionRecording: {
      type: ObjectId,
      ref: 'Debug-Session',
    },
  }],

  attributes: {
    type: {
      type: String,
      enum: Object.values(EndUserType),
      required: true,
    },
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    groupId: {
      type: String,
    },
    groupName: {
      type: String,
    },
    environment: {
      type: String,
    },
    environmentSlug: {
      type: String,
    },
    userEmail: {
      type: String,
    },
    userId: {
      type: String,
    },
    userName: {
      type: String,
    },
    accountId: {
      type: String,
    },
    accountName: {
      type: String,
    },
    orgId: {
      type: String,
    },
    orgName: {
      type: String,
    },
  },
  lastSeen: {
    type: Date,
  },

  conditionalRecordingSettings: {
    recordingOptions: SessionRecordingOptionsSchema,
    whenToRecord: {
      type: String,
      enum: Object.values(SessionRecordingNextRecordType),
    },
    sessionRecordingsCount: {
      type: Number,
      default: 0,
    },
    sessionRecordingsLimit: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
})

const getEndUserHash = (
  payload: Partial<IEndUser>,
): string => {
  const hash = createHash('md5')
    .update(`${payload.workspace}-${payload.project}-${JSON.stringify(payload.attributes || {})}`)
    .digest('hex')

  return hash
}

EndUserSchema.statics.getEndUserHash = getEndUserHash

EndUserSchema.statics.createEndUser = async function (
  payload: Partial<IEndUser>,
) {
  if (payload.attributes?.environment) {
    payload.attributes.environmentSlug = slugifyString(payload.attributes.environment)
  } else {
    delete payload?.attributes?.environmentSlug
  }

  const hash = getEndUserHash(payload)
  const lastSeen = new Date()

  const _payload = {
    ...payload,
    hash,
    lastSeen,
  }

  if (
    _payload.attributes?.type === EndUserType.VISITOR
    && Object.keys(_payload.attributes || {}).length === 1
  ) {
    return new this(_payload).save()
  }

  const condition: any = {
    hash,
  }

  return this.findOneAndUpdate(
    condition,
    _payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

EndUserSchema.statics.findEndUser = async function (
  filter: {
    project: string | ObjectId,
    workspace: string | ObjectId,
    attributes: IEndUser['attributes']
  },
): Promise<IEndUserDocument | undefined> {
  const hash = createHash('md5').update(JSON.stringify(filter.attributes || {})).digest('hex')

  return this.findOne({
    workspace: filter.workspace,
    project: filter.project,
    hash,
  })
}

EndUserSchema.statics.findIssueByIdAndProjectAndWorkspace = async function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
): Promise<IEndUserDocument | undefined> {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

EndUserSchema.statics.findEndUserByClientId = async function (
  clientId: string,
): Promise<IEndUserDocument | undefined> {
  return this.findOne({
    'connections.clientId': clientId,
  })
}

EndUserSchema.statics.findEndUsers = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,

    _id?: string[] | ObjectId[] | string | ObjectId,

    'attributes.type'?: string,
    'attributes.id'?: string,
    'attributes.name'?: string,
    'attributes.groupId'?: string,
    'attributes.groupName'?: string,
    'attributes.environment'?: string,
    'attributes.environmentSlug'?: string,
    'attributes.userEmail'?: string,
    'attributes.userId'?: string,
    'attributes.userName'?: string,
    'attributes.accountId'?: string,
    'attributes.accountName'?: string,
    'attributes.orgId'?: string,
    'attributes.orgName'?: string,

    'lastSeen.gte'?: string | Date,
    'lastSeen.lte'?: string | Date,

    online?: boolean,

    text?: string,
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
  $project?: any,
) {
  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const {
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    workspace,
    project,
    text,
    _id,
    online,
    ..._filter
  } = filter

  const matchConditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    ..._filter,
  }

  if (_id) {
    if (Array.isArray(_id)) {
      matchConditions._id = {
        $in: _id.map((id) => new ObjectId(id)),
      }
    } else {
      matchConditions._id = new ObjectId(_id)
    }
  }

  if (lastSeenGte) {
    matchConditions.lastSeen = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions.lastSeen = {
      ...(matchConditions.lastSeen || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (typeof online === 'boolean') {
    matchConditions['connections.0'] = {
      $exists: online,
    }
  }

  if (text) {
    // matchConditions.$text = {
    //   $search: text,
    // }
    matchConditions.$or = [{
      'attributes.id': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.name': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.groupId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.groupName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.userEmail': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.userId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.userName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.accountId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.accountName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.orgId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'attributes.orgName': {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  const pipeline = [
    {
      $match: matchConditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(
            typeof cursor?.skip === 'number'
            && typeof cursor?.limit === 'number'
          )
            ? [
              { $skip: cursor.skip },
              { $limit: cursor.limit },
            ]
            : [],
          ...$project ? [{ $project }] : [],
        ],
      },
    },
  ]

  const [{
    items,
    count: [{ count } = { count: 0 }],
  }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

EndUserSchema.statics.findEndUserByIdAndProjectAndWorkspace = function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
): Promise<IEndUserDocument | undefined> {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

EndUserSchema.statics.removeEndUserById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

EndUserSchema.statics.deleteEndUsersByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

EndUserSchema.statics.deleteEndUsersByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

EndUserSchema.statics.bulkDeleteEndUsersByIds = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  ids?: string[] | ObjectId[],
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
    ...ids?.length
      ? {
        _id: {
          $in: ids.map(id => new ObjectId(id)),
        },
      }
      : {},
  })
}

EndUserSchema.statics.updateConditionalRecordingSettings = async function (
  id: string | ObjectId,
  payload: IEndUser['conditionalRecordingSettings'],
): Promise<IEndUser['conditionalRecordingSettings'] | undefined> {
  const _payload = MongoPayload.prependToKeys(MongoPayload.flattenObject(payload), 'conditionalRecordingSettings')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const { conditionalRecordingSettings } = await this.findOneAndUpdate(
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

  return conditionalRecordingSettings
}

EndUserSchema.statics.bulkUpdateRemoteSessionRecordingSettings = async function (
  ids: string[] | ObjectId[],
  payload: IEndUser['conditionalRecordingSettings'],
): Promise<(IEndUser['conditionalRecordingSettings'] | undefined)[]> {
  const _payload = MongoPayload.prependToKeys(
    MongoPayload.flattenObject(payload),
    'conditionalRecordingSettings',
  )
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  await this.updateMany(
    {
      _id: {
        $in: ids.map(id => new ObjectId(id)),
      },
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

  const endUsers = await this.find({
    _id: {
      $in: ids.map(id => new ObjectId(id)),
    },
  })

  return endUsers.map(endUser => endUser.conditionalRecordingSettings)
}

EndUserSchema.statics.upsertSocketIdToEndUserByHash = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  hash: string,
  socketId: string,
  state?: EndUserState,
): Promise<IEndUserDocument | undefined> {
  const endUser = await this.findOneAndUpdate(
    {
      workspace: new ObjectId(workspaceId),
      project: new ObjectId(projectId),
      hash,
      connections: {
        $elemMatch: {
          socketId,
        },
      },
    },
    {
      $set: {
        'connections.$': {
          socketId,
          state: state || EndUserState.IDLE,
        },
      },
    },
    { new: true, runValidators: true },
  )

  if (endUser) {
    return endUser
  }

  return this.findOneAndUpdate(
    {
      workspace: new ObjectId(workspaceId),
      project: new ObjectId(projectId),
      hash,
      connections: {
        $not: {
          $elemMatch: {
            socketId,
          },
        },
      },
    },
    {
      $push: {
        connections: {
          socketId,
          state: state || EndUserState.IDLE,
        },
      },
    },
    { new: true, runValidators: true },
  )
}

EndUserSchema.statics.upsertSocketIdToEndUserById = async function (
  id: string | ObjectId,
  socketId: string,
  clientId?: string,
  state?: EndUserState,
): Promise<IEndUserDocument> {
  const endUser = await this.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      connections: {
        $elemMatch: {
          socketId,
        },
      },
    },
    {
      $set: {
        'connections.$': {
          socketId,
          clientId,
          state: state || EndUserState.IDLE,
        },
      },
    },
    { new: true, runValidators: true },
  )

  if (endUser) {
    return endUser
  }

  return this.findOneAndUpdate(
    {
      _id: new ObjectId(id),
      connections: {
        $not: {
          $elemMatch: {
            socketId,
          },
        },
      },
    },
    {
      $push: {
        connections: {
          socketId,
          clientId,
          state: state || EndUserState.IDLE,
        },
      },
    },
    { new: true, runValidators: true },
  )
}

EndUserSchema.statics.disconnectEndUserBySocketId = async function (
  socketId: string,
): Promise<void> {
  return this.updateMany(
    {
      'connections.socketId': socketId,
    },
    {
      $pull: {
        connections: {
          socketId,
        },
      },
    },
  )
}

EndUserSchema.statics.findEndUsersBySocketId = async function (
  socketId: string,
): Promise<IEndUserDocument[]> {
  return this.find({
    'connections.socketId': socketId,
  })
}

EndUserSchema.statics.updateEndUserStateBySocketId = async function (
  socketId: string,
  payload: {
    state: EndUserState,
    recordingMode?: SessionRecordingMode,
    sessionRecording?: string,
  },
): Promise<IEndUserDocument | undefined> {
  return this.findOneAndUpdate(
    {
      connections: {
        $elemMatch: {
          socketId,
        },
      },
    },
    {
      $set: {
        'connections.$': {
          socketId,
          state: payload.state,
          recordingMode: payload.recordingMode,
          sessionRecording: payload.sessionRecording ? new ObjectId(payload.sessionRecording) : undefined,
        },
      },
    },
    { new: true, runValidators: true },
  )
}

EndUserSchema.statics.getEndUsersWithConnectionsCursor = function (): any {
  return this.find({
    connections: {
      $exists: true,
    },
  }).cursor()
}

EndUserSchema.statics.incrementSessionRecordingsCount = async function (filter: {
  hash?: string,
  clientId?: string,
}): Promise<IEndUserDocument | undefined> {
  if (!filter.hash && !filter.clientId) {
    throw new Error('No condition provided')
  }

  const condition: any = {}

  if (filter.hash) {
    condition.hash = filter.hash
  }

  if (filter.clientId) {
    condition['connections.clientId'] = filter.clientId
  }

  return this.findOneAndUpdate(
    condition,
    {
      $inc: {
        'conditionalRecordingSettings.sessionRecordingsCount': 1,
      },
    },
    { new: true, runValidators: true },
  )
}

EndUserSchema.index({
  workspace: 1,
  project: 1,
})

EndUserSchema.index({
  workspace: 1,
  project: 1,
  hash: 1,
})

EndUserSchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3, // 3 days
    partialFilterExpression: {
      'attributes.type': EndUserType.VISITOR,
    },
  },
)

EndUserSchema.index({
  'attributes.type': 'text',
  'attributes.id': 'text',
  'attributes.name': 'text',
  'attributes.groupId': 'text',
  'attributes.groupName': 'text',
  'attributes.userEmail': 'text',
  'attributes.userId': 'text',
  'attributes.userName': 'text',
  'attributes.accountId': 'text',
  'attributes.accountName': 'text',
  'attributes.orgId': 'text',
  'attributes.orgName': 'text',
  'attributes.tags': 'text',
})

export const EndUserModel = mongoose.model<IEndUserDocument, IEndUserModel>('End-User', EndUserSchema)
