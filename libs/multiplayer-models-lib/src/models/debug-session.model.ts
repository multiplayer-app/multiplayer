import { SessionType } from '@multiplayer-app/session-recorder-common'
import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IDebugSession,
  IDebugSessionView,
  ICursor,
  DataWithCursor,
  ITag,
  DebugSessionDataType,
  DebugSessionCreationReasonType,
  IDebugSessionIssue,
} from '@multiplayer/types'
import { MongoPayload, RandomToken } from '@multiplayer/util'
import { ISortOptions } from '../types'
import { TagSchema } from './shared/tag.model'
import { EndUserModel } from './end-user.model'

const { Schema } = mongoose

export interface IDebugSessionDocument extends Omit<IDebugSession, '_id'>, Document {
  _id: ObjectId

  toObject(): IDebugSession
  toJSON(): IDebugSession
}

export interface IDebugSessionModel extends Model<IDebugSessionDocument> {
  createDebugSession(
    payload: Partial<IDebugSession> & { sessionType: SessionType },
  ): Promise<IDebugSessionDocument>

  findDebugSessionById(
    id: string | ObjectId,
  ): Promise<IDebugSessionDocument | undefined>

  getNotTransferedDebugSessionIdByShortId(
    shortId: string | ObjectId,
  ): Promise<ObjectId>

  findDebugSessionByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IDebugSessionDocument | undefined>

  findDebugSessions(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      _id?: string | ObjectId | string[] | ObjectId[]
      name?: string,
      tags?: ITag[],
      startedAfterTimestamp?: number,
      startedBeforeTimestamp?: number,
      minDurationInSeconds?: number,
      maxDurationInSeconds?: number,
      starred?: boolean,
      hasStarredItems?: boolean,
      creationReason?: DebugSessionCreationReasonType | DebugSessionCreationReasonType[],
      continuousDebugSession?: string | { $exists: boolean },
      stoppedAt?: { $exists: boolean }
      issueHash?: string,
      issueTitleHash?: string,
      issueComponentHash?: string,
      issueCustomHash?: string,
      endUserHash?: string
      createdAt?: { $gte?: Date, $lte?: Date }
    } & {
      [Key in `sessionAttributes.${string}`]?: string;
    } & {
      [Key in `resourceAttributes.${string}`]?: string;
    } & {
      [Key in `userAttributes.${string}`]?: string;
    },
    cursor?: ICursor,
    sort?: ISortOptions,
    $project?: any
  ): Promise<DataWithCursor<IDebugSessionDocument>>

  countDebugSessions(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
    },
  ): Promise<number>

  updateDebugSessionById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IDebugSession>
  ): Promise<IDebugSessionDocument | undefined>

  addDebugSessionViewById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IDebugSession>
  ): Promise<IDebugSessionDocument | undefined>

  updateDebugSessionViewById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    viewId: string | ObjectId,
    payload: Partial<IDebugSession>
  ): Promise<IDebugSessionDocument | undefined>

  removeDebugSessionViewById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    viewId: string | ObjectId,
  ): Promise<IDebugSessionDocument | undefined>

  addDebugSessionStarredItemById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    starId: string | ObjectId,
  ): Promise<IDebugSessionDocument | undefined>

  removeDebugSessionStarredItemById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    starId: string | ObjectId,
  ): Promise<IDebugSessionDocument | undefined>

  stopDebugSessionById(
    id: string | ObjectId,
    payload?: Partial<IDebugSession>,
  ): Promise<IDebugSessionDocument | undefined>

  getDebugSessionsInWorkspaceCursor(
    workspaceId: string | ObjectId,
  ): any

  deleteDebugSessionsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteDebugSessionById(
    id: string | ObjectId,
  ): Promise<void>

  bulkDeleteDebugSessions(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    ids?: string[] | ObjectId[],
  ): Promise<void>

  getUniqueTags(
    filter: {
      workspaceId: string | ObjectId,
      projectId: string | ObjectId,
    }
  ): Promise<string[]>

  addS3File(
    id: string | ObjectId,
    s3File: {
      _id?: string | ObjectId,
      bucket: string
      key: string
      dataType: DebugSessionDataType,
      totalCount: number
    },
  ): Promise<IDebugSessionDocument | undefined>

  getStuckNotStoppedDebugSessionsCursor(): any

  addIssueById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    _id: string | ObjectId,
    issue: IDebugSessionIssue,
  ): Promise<IDebugSessionDocument | undefined>

  addIssueByShortId(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    shortId: string | ObjectId,
    issue: IDebugSessionIssue,
  ): Promise<IDebugSessionDocument | undefined>

  updateDebugSessionBySocketId(
    socketId: string | ObjectId,
    payload: Partial<IDebugSession>,
  ): Promise<IDebugSessionDocument | undefined>

  removeSocketIdFromDebugSession(
    socketId: string | ObjectId,
  ): Promise<void>
}

const DebugSessionSchema = new Schema({
  shortId: {
    type: String,
    required: true,
    index: true,
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
  sessionType: {
    type: String,
    required: true,
    enum: Object.values(SessionType),
  },
  clientId: {
    type: String,
  },
  creationReason: {
    type: String,
    enum: Object.values(DebugSessionCreationReasonType),
  },
  continuousDebugSession: {
    type: String,
  },
  name: {
    type: String,
  },
  tags: [TagSchema],
  issues: [{
    issueHash: {
      type: String,
      index: true,
      required: true,
    },
    issueTitleHash: {
      type: String,
      index: true,
      required: true,
    },
    issueComponentHash: {
      type: String,
      index: true,
      required: true,
    },
    issueCustomHash: {
      type: String,
    },
    traceId: {
      type: String,
      required: true,
    },
    spanId: {
      type: String,
      required: true,
    },
  }],

  sessionAttributes: {
    type: Schema.Types.Mixed,
  },
  resourceAttributes: {
    type: Schema.Types.Mixed,
  },
  userAttributes: {
    type: Schema.Types.Mixed,
  },
  endUserHash: {
    type: String,
    index: true,
  },

  socketId: {
    type: String,
    index: true,
  },

  startedAt: {
    type: Date,
    required: true,
  },
  stoppedAt: {
    type: Date,
  },
  durationInSeconds: {
    type: Number,
  },
  views: [new Schema({
    name: {
      type: String,
    },
    components: [{
      type: String,
    }],
  })],
  starred: {
    type: Boolean,
  },
  starredItems: [{
    type: String,
  }],
  s3Files: [{
    bucket: {
      type: String,
    },
    key: {
      type: String,
    },
    dataType: {
      type: String,
      enum: Object.values(DebugSessionDataType),
    },
    totalCount: {
      type: Number,
    },
  }],
  finishedS3Transfer: {
    type: Boolean,
  },
}, {
  timestamps: true,
})

DebugSessionSchema.statics.createDebugSession = async function (
  payload: Partial<IDebugSession>,
) {
  const _payload = { ...payload }

  if (!_payload.shortId) {
    _payload.shortId = await RandomToken.generateRandomToken(16)
  }

  if (_payload.userAttributes) {
    const hash = EndUserModel.getEndUserHash({
      attributes: _payload.userAttributes,
      workspace: _payload.workspace?.toString(),
      project: _payload.project?.toString(),
    })

    _payload.endUserHash = hash
  }

  return this.findOneAndUpdate(
    payload,
    _payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

DebugSessionSchema.statics.findDebugSessionById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

DebugSessionSchema.statics.getNotTransferedDebugSessionIdByShortId = async function (
  shortId: string | ObjectId,
): Promise<ObjectId> {
  const debugSession = await this.findOne({
    shortId,
    finishedS3Transfer: { $ne: true },
    $or: [
      {
        $expr: {
          $gte: [
            new Date(),
            '$startedAt',
          ],
        },
      },
      {
        stoppedAt: { $exists: false },
      },
    ],
  }, { _id: 1 })

  return debugSession?._id
}

DebugSessionSchema.statics.findDebugSessionByIdAndProjectAndWorkspace = function (
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

DebugSessionSchema.statics.findDebugSessions = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    _id?: string | ObjectId | string[] | ObjectId[]
    name?: string,
    tags?: ITag[],
    startedAfterTimestamp?: number,
    startedBeforeTimestamp?: number,
    minDurationInSeconds?: number,
    maxDurationInSeconds?: number,
    starred?: boolean,
    hasStarredItems?: boolean,
    creationReason?: DebugSessionCreationReasonType | DebugSessionCreationReasonType[],
    continuousDebugSession?: string | { $exists: boolean },
    stoppedAt?: { $exists: boolean },
    issueHash?: string,
    issueTitleHash?: string,
    issueComponentHash?: string,
    issueCustomHash?: string,
    endUserHash?: string,
    createdAt?: { $gte?: string | Date, $lte?: string | Date }
  } & {
    [Key in `sessionAttributes.${string}`]?: string;
  } & {
    [Key in `resourceAttributes.${string}`]?: string;
  } & {
    [Key in `userAttributes.${string}`]?: string;
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
  $project?: any,
) {
  // cursor.skip = cursor.skip || SKIP
  // cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (filter._id) {
    conditions._id = Array.isArray(filter._id)
      ? { $in: filter._id.map(_id => new ObjectId(_id)) }
      : new ObjectId(filter._id)
  }

  Object.keys(filter)
    .filter((key) => key.startsWith('sessionAttributes.'))
    .forEach((key) => {
      conditions[key] = filter[key]
    })

  Object.keys(filter)
    .filter((key) => key.startsWith('resourceAttributes.'))
    .forEach((key) => {
      conditions[key] = filter[key]
    })

  Object.keys(filter)
    .filter((key) => key.startsWith('userAttributes.'))
    .forEach((key) => {
      conditions[key] = filter[key]
    })

  if (filter.name) {
    conditions.name = {
      $regex: new RegExp(filter.name, 'i'),
    }
  }

  if (filter.tags?.length) {
    conditions.tags = {
      $all: filter.tags.map(tag => ({
        $elemMatch: {
          ...tag.key ? { key: tag.key } : {},
          value: tag.value,
        },
      })),
    }
  }

  if (filter.startedAfterTimestamp) {
    conditions.startedAt = conditions.startedAt || {}
    conditions.startedAt.$gte = new Date(filter.startedAfterTimestamp * 1000)
  }

  if (filter.startedBeforeTimestamp) {
    conditions.startedAt = conditions.startedAt || {}
    conditions.startedAt.$lte = new Date(filter.startedBeforeTimestamp * 1000)
  }

  if (typeof filter.minDurationInSeconds === 'number') {
    conditions.durationInSeconds = conditions.durationInSeconds || {}
    conditions.durationInSeconds.$gte = filter.minDurationInSeconds
  }

  if (typeof filter.maxDurationInSeconds === 'number') {
    conditions.durationInSeconds = conditions.durationInSeconds || {}
    conditions.durationInSeconds.$lte = filter.maxDurationInSeconds
  }

  if (filter.hasStarredItems === true) {
    conditions.starredItems = { $exists: true, $ne: [] }
  }

  if (typeof filter.starred === 'boolean') {
    conditions.starred = filter.starred
  }

  if (filter.creationReason) {
    conditions.creationReason = Array.isArray(filter.creationReason)
      ? { $in: filter.creationReason }
      : filter.creationReason
  }

  if (filter.continuousDebugSession) {
    conditions.continuousDebugSession = filter.continuousDebugSession
  }

  if (filter.stoppedAt) {
    conditions.stoppedAt = filter.stoppedAt
  }

  if (filter.issueHash) {
    conditions['issues.issueHash'] = filter.issueHash
  }
  if (filter.issueTitleHash) {
    conditions['issues.issueTitleHash'] = filter.issueTitleHash
  }
  if (filter.issueComponentHash) {
    conditions['issues.issueComponentHash'] = filter.issueComponentHash
  }
  if (filter.issueCustomHash) {
    conditions['issues.issueCustomHash'] = filter.issueCustomHash
  }

  if (filter.endUserHash) {
    conditions.endUserHash = filter.endUserHash
  }

  if (filter.createdAt) {
    conditions.createdAt = filter.createdAt
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
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

DebugSessionSchema.statics.countDebugSessions = function (
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

DebugSessionSchema.statics.updateDebugSessionById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IDebugSession>,
): Promise<IDebugSessionDocument | undefined> {
  const {
    resourceAttributes,
    sessionAttributes,
    userAttributes,
    ..._payload
  } = payload
  const data: Partial<IDebugSession> = {
    ..._payload,
  }
  if (sessionAttributes) {
    const _sessionAttributes = MongoPayload.flattenObject(sessionAttributes)
    data.sessionAttributes = {}

    for (const sessionAttributeKey in _sessionAttributes) {
      data.sessionAttributes[sessionAttributeKey] = _sessionAttributes[sessionAttributeKey]
    }
  }

  if (resourceAttributes) {
    data.resourceAttributes = {}
    const _resourceAttributes = MongoPayload.flattenObject(resourceAttributes)

    for (const _resourceAttributeKey in _resourceAttributes) {
      data.resourceAttributes[_resourceAttributeKey] = _resourceAttributes[_resourceAttributeKey]
    }
  }

  if (userAttributes) {
    data.userAttributes = {
      type: userAttributes.type,
    }
    const _userAttributes = MongoPayload.flattenObject(userAttributes)

    for (const _userAttributeKey in _userAttributes) {
      data.userAttributes[_userAttributeKey] = _userAttributes[_userAttributeKey]
    }

    const hash = EndUserModel.getEndUserHash({
      attributes: userAttributes,
      workspace: workspaceId.toString(),
      project: projectId.toString(),
    })

    _payload.endUserHash = hash
  }

  const { set, unset } = MongoPayload.groupBySetUnset(data)

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
    },
  )
}


DebugSessionSchema.statics.addDebugSessionViewById = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IDebugSession>,
): Promise<any | undefined> {
  const conditions = {
    _id: id,
    workspace: workspaceId,
    project: projectId,
  }

  const updatedDebugSession = await this.findOneAndUpdate(
    conditions,
    {
      $push: {
        views: payload,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  return updatedDebugSession.views[updatedDebugSession.views.length - 1]
}

DebugSessionSchema.statics.updateDebugSessionViewById = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  viewId: string | ObjectId,
  payload: Partial<IDebugSessionView>,
): Promise<any | undefined> {
  const _payload = MongoPayload.prependToKeys(payload, 'views.$')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const conditions = {
    _id: id,
    workspace: workspaceId,
    project: projectId,
    'views._id': viewId,
  }

  const updatedDebugSession = await this.findOneAndUpdate(
    conditions,
    {
      $set: set,
      $unset: unset,
    },
    {
      new: true,
      runValidators: true,
    },
  )

  return updatedDebugSession.views?.find(({ _id }) => _id.equals(viewId))
}

DebugSessionSchema.statics.removeDebugSessionViewById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  viewId: string | ObjectId,
): Promise<IDebugSessionDocument | undefined> {
  const conditions = {
    _id: id,
    workspace: workspaceId,
    project: projectId,
  }

  return this.findOneAndUpdate(
    conditions,
    {
      $pull: {
        views: {
          _id: new ObjectId(viewId),
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

DebugSessionSchema.statics.addDebugSessionStarredItemById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  starId: string | ObjectId,
): Promise<IDebugSessionDocument | undefined> {
  const conditions = {
    _id: id,
    workspace: workspaceId,
    project: projectId,
  }

  return this.findOneAndUpdate(
    conditions,
    {
      $addToSet: {
        starredItems: starId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

DebugSessionSchema.statics.removeDebugSessionStarredItemById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  starId: string | ObjectId,
): Promise<IDebugSessionDocument | undefined> {
  const conditions = {
    _id: id,
    workspace: workspaceId,
    project: projectId,
  }

  return this.findOneAndUpdate(
    conditions,
    {
      $pull: {
        starredItems: starId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

DebugSessionSchema.statics.stopDebugSessionById = function (
  id: string | ObjectId,
  payload?: Partial<IDebugSession>,
): Promise<IDebugSessionDocument | undefined> {
  const {
    resourceAttributes,
    sessionAttributes,
    ..._payload
  } = payload || {}
  const data: any = {
    ..._payload,
    stoppedAt: payload?.stoppedAt || new Date(),
  }

  if (resourceAttributes) {
    const _resourceAttributes = MongoPayload.flattenObject(resourceAttributes)
    data.resourceAttributes = {}

    for (const resourceAttributeKey in _resourceAttributes) {
      data.resourceAttributes[resourceAttributeKey] = _resourceAttributes[resourceAttributeKey]
    }
  }

  if (sessionAttributes) {
    const _sessionAttributes = MongoPayload.flattenObject(sessionAttributes)
    data.sessionAttributes = {}

    for (const _sessionAttributeKey in _sessionAttributes) {
      data.sessionAttributes[_sessionAttributeKey] = _sessionAttributes[_sessionAttributeKey]
    }
  }

  return this.findOneAndUpdate(
    {
      _id: id,
      stoppedAt: { $exists: false },
    },
    {
      $set: data,
      $unset: {
        socketId: '',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

DebugSessionSchema.statics.getDebugSessionsInWorkspaceCursor = function (
  workspaceId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
  }).sort({ _id: 1 }).cursor()
}

DebugSessionSchema.statics.deleteDebugSessionsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

DebugSessionSchema.statics.deleteDebugSessionById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

DebugSessionSchema.statics.bulkDeleteDebugSessions = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  ids?: string[] | ObjectId[],
): Promise<void> {
  const conditions: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    _id?: {
      $in: ObjectId[],
    }
  } = {
    workspace: workspaceId,
    project: projectId,
  }

  if (ids?.length) {
    conditions._id = {
      $in: ids.map(id => new ObjectId(id)),
    }
  }

  return this.deleteMany(conditions)
}

DebugSessionSchema.statics.getUniqueTags = async function (filter: {
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

DebugSessionSchema.statics.addS3File = function (
  id: string | ObjectId,
  s3File: {
    _id?: string | ObjectId,
    bucket: string
    key: string
    dataType: DebugSessionDataType
    totalCount: number
  },
): Promise<void> {
  return this.updateOne({
    _id: id,
  }, {
    $push: {
      s3Files: s3File,
    },
  }, {
    new: true,
    runValidators: true,
  })
}

DebugSessionSchema.statics.getStuckNotStoppedDebugSessionsCursor = function (): any {
  return this.find({
    createdAt: { $lte: new Date(Date.now() - 19 * 60 * 1000) }, // 19 min ago
    $or: [
      {
        finishedS3Transfer: { $ne: true },
      },
      {
        stoppedAt: { $exists: false },
      },
    ],
  }).cursor()
}

DebugSessionSchema.statics.addIssueById = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  _id: string | ObjectId,
  issue: IDebugSessionIssue,
): Promise<any | undefined> {
  const conditions = {
    _id,
    workspace: workspaceId,
    project: projectId,
    issues: {
      $not: {
        $elemMatch: {
          traceId: issue.traceId,
          spanId: issue.spanId,
        },
      },
    },
  }

  const updatedDebugSession = await this.findOneAndUpdate(
    conditions,
    {
      $push: {
        issues: issue,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!updatedDebugSession) return undefined

  return updatedDebugSession.issues[updatedDebugSession.issues.length - 1]
}

DebugSessionSchema.statics.addIssueByShortId = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  _id: string | ObjectId,
  issue: IDebugSessionIssue,
): Promise<any | undefined> {
  const conditions = {
    _id,
    workspace: workspaceId,
    project: projectId,
    issues: {
      $not: {
        $elemMatch: {
          traceId: issue.traceId,
          spanId: issue.spanId,
        },
      },
    },
  }

  const updatedDebugSession = await this.findOneAndUpdate(
    conditions,
    {
      $push: {
        issues: issue,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!updatedDebugSession) return undefined

  return updatedDebugSession.issues[updatedDebugSession.issues.length - 1]
}

DebugSessionSchema.statics.updateDebugSessionBySocketId = function (
  socketId: string | ObjectId,
  payload: Partial<IDebugSession>,
): Promise<IDebugSessionDocument | undefined> {
  const {
    resourceAttributes,
    sessionAttributes,
    userAttributes,
    ..._payload
  } = payload
  const data: Partial<IDebugSession> = {
    ..._payload,
  }
  if (sessionAttributes) {
    const _sessionAttributes = MongoPayload.flattenObject(sessionAttributes)
    data.sessionAttributes = {}

    for (const sessionAttributeKey in _sessionAttributes) {
      data.sessionAttributes[sessionAttributeKey] = _sessionAttributes[sessionAttributeKey]
    }
  }

  if (resourceAttributes) {
    data.resourceAttributes = {}
    const _resourceAttributes = MongoPayload.flattenObject(resourceAttributes)

    for (const _resourceAttributeKey in _resourceAttributes) {
      data.resourceAttributes[_resourceAttributeKey] = _resourceAttributes[_resourceAttributeKey]
    }
  }

  if (userAttributes) {
    data.userAttributes = {
      type: userAttributes.type,
    }
    const _userAttributes = MongoPayload.flattenObject(userAttributes)

    for (const _userAttributeKey in _userAttributes) {
      data.userAttributes[_userAttributeKey] = _userAttributes[_userAttributeKey]
    }
  }

  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    {
      socketId,
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

DebugSessionSchema.statics.removeSocketIdFromDebugSession = function (
  socketId: string | ObjectId,
): Promise<void> {
  return this.updateMany(
    {
      socketId,
    },
    { $unset: { socketId: '' } },
  )
}

DebugSessionSchema.index({
  workspace: 1,
  project: 1,
})

DebugSessionSchema.index({
  shortId: 1,
  workspace: 1,
  project: 1,
  createdAt: -1,
})

// DebugSessionSchema.index(
//   {
//     shortId: 1,
//   },
//   {
//     unique: true,
//     partialFilterExpression: {
//       stoppedAt: {
//         $exists: false,
//       },
//     },
//   },
// )

// DebugSessionSchema.index(
//   {
//     shortId: 1,
//   },
//   {
//     unique: true,
//     partialFilterExpression: {
//       startedAt: {
//         $lte: now - TTl,
//       },
//     },
//   },
// )

export const DebugSessionModel = mongoose.model<
  IDebugSessionDocument,
  IDebugSessionModel
>('Debug-Session', DebugSessionSchema)
