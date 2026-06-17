import { mongoose, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { Model, Cursor, HydratedDocument } from 'mongoose'
import {
  IAgentChat,
  AgentChatStatus,
  DataWithCursor,
  ICursor,
  AgentChatType,
  AgentType,
  AgentChatStartReasonEnum,
} from '@multiplayer/types'
import { ISortOptions } from '../types'

const { Schema } = mongoose

export interface IAgentChatDocument extends Omit<IAgentChat, '_id'>, Omit<Document, 'title' | 'dir'> {
  _id: ObjectId
  id?: string
  toObject(): IAgentChat
  toJSON(): IAgentChat
}

const getTemporaryTitle = (contextKey: string): string => {
  return `${contextKey} session ${new Date().toISOString()}`
}

export interface IAgentChatModel extends Model<IAgentChatDocument> {
  createAgentChat(payload: Partial<IAgentChat>): Promise<IAgentChatDocument>

  upsertAgentChat(payload: Partial<IAgentChat>): Promise<IAgentChatDocument>

  findAgentChatById(id: string | ObjectId): Promise<IAgentChatDocument | undefined>

  findAgentChatByChatId(chatId: string): Promise<IAgentChatDocument | undefined>

  findAgentChats(
    filter: {
      workspace: string | ObjectId
      project: string | ObjectId
      status?: AgentChatStatus
      agent?: string | ObjectId
      archived?: boolean
      agentName?: string
      dir?: string
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IAgentChatDocument>>

  updateAgentChatById(
    id: string | ObjectId,
    payload: Partial<IAgentChat | IAgentChatDocument>,
  ): Promise<IAgentChatDocument | undefined>

  bulkUpdateAgentChats(
    conditions: Record<string, unknown>,
    payload: Partial<Pick<IAgentChat, 'title' | 'archived' | 'metadata' | 'model' | 'agentName'>>,
  ): Promise<IAgentChatDocument[]>

  findAgentChatCursor(
    filter?: {
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      agent?: string | ObjectId,
      type?: AgentType,
      status?: AgentChatStatus | AgentChatStatus[],
    },
  ): Cursor<HydratedDocument<IAgentChatDocument>>

  pushAttachedDebugSession(chatId: string | ObjectId, debugSessionId: string): Promise<IAgentChatDocument | null>

  pullAttachedDebugSession(chatId: string | ObjectId, debugSessionId: string): Promise<IAgentChatDocument | null>

  removeDebugSessionReferences(debugSessionId: string): Promise<void>

  findChatsWithDebugSession(debugSessionId: string): Promise<IAgentChatDocument[]>
}

const AgentChatSchema = new Schema({
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
  agent: {
    type: ObjectId,
    ref: 'Agent',
    required: true,
  },
  title: {
    type: String,
  },
  type: {
    type: String,
    enum: Object.values(AgentChatType),
    required: true,
  },
  agentType: {
    type: String,
    enum: Object.values(AgentType),
  },
  status: {
    type: String,
    enum: Object.values(AgentChatStatus),
    required: true,
  },
  contextKey: {
    type: String,
  },
  startedByWorkspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User',
  },
  userId: {
    type: ObjectId,
    ref: 'Workspace-User',
  },
  archived: {
    type: Boolean,
    default: false,
  },
  startReason: {
    type: String,
    enum: Object.values(AgentChatStartReasonEnum),
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
  model: {
    type: String,
  },
  agentName: {
    type: String,
  },
  dir: {
    type: String,
  },
  git: {
    branchName: { type: String },
    branchUrl: { type: String },
    prUrl: { type: String },
    codeChanges: {
      additions: { type: Number },
      deletions: { type: Number },
    },
  },
  contextDoc: {
    key: { type: String },
    bucket: { type: String },
    url: { type: String },
  },
}, {
  timestamps: true,
})

AgentChatSchema.index({ workspace: 1, project: 1 })
AgentChatSchema.index({ agent: 1 })

AgentChatSchema.statics.createAgentChat = function (payload: Partial<IAgentChat>) {
  return new this(payload).save()
}

AgentChatSchema.statics.upsertAgentChat = function (payload: Partial<IAgentChat>) {
  return this.findOneAndUpdate(
    {
      _id: payload._id,
    },
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

AgentChatSchema.statics.findAgentChatById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

AgentChatSchema.statics.findAgentChatByChatId = function (chatId: string) {
  return this.findOne({ _id: chatId })
}

AgentChatSchema.statics.findAgentChats = async function (
  filter: {
    workspace: string | ObjectId
    project: string | ObjectId
    status?: AgentChatStatus
    agent?: string | ObjectId
    archived?: boolean
    agentName?: string
    dir?: string
  },
  cursor?: ICursor,
  sort?: ISortOptions,
) {
  const _sort: any = {}
  let _cursor: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['_id'] = -1
  }

  if (
    typeof cursor?.skip === 'number'
    && typeof cursor?.limit === 'number') {
    _cursor = cursor
  }

  const { workspace, project, agentName, dir, ...rest } = filter
  const conditions: any = {
    ...rest,
    workspace: new ObjectId(workspace),
    project: new ObjectId(project),
    ...(rest.agent ? { agent: new ObjectId(rest.agent) } : {}),
  }
  delete conditions.agent
  if (filter.agent) {
    conditions.agent = new ObjectId(filter.agent)
  }
  if (agentName) {
    conditions.agentName = agentName
  }
  if (dir) {
    conditions.dir = dir
  }
  if ('archived' in filter) {
    conditions.archived = filter.archived
      ? filter.archived
      : { $ne: true }
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    { $match: conditions },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(
            typeof _cursor?.skip === 'number'
            && typeof _cursor?.limit === 'number'
          )
            ? [
              { $skip: _cursor.skip },
              { $limit: _cursor.limit },
            ]
            : [],
          {
            $addFields: {
              id: '$_id',
            },
          },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor?.skip,
      limit: cursor?.limit,
    },
  }
}

AgentChatSchema.statics.updateAgentChatById = function (
  id: string | ObjectId,
  payload: Partial<IAgentChat>,
) {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    { _id: id },
    {
      $set: set,
      $unset: unset,
    },
    { new: true, runValidators: true },
  )
}

AgentChatSchema.statics.bulkUpdateAgentChats = async function (
  conditions: Record<string, unknown>,
  payload: Partial<Pick<IAgentChat, 'title' | 'archived' | 'metadata' | 'model' | 'agentName'>>,
): Promise<IAgentChatDocument[]> {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.prepareUpdateParams(_payload)

  await this.updateMany(conditions, { $set: set, $unset: unset })

  return this.find(conditions)
}

AgentChatSchema.statics.findAgentChatCursor = function (
  filter?: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    agent?: string | ObjectId,
    type?: AgentType,
    status?: AgentChatStatus | AgentChatStatus[],
  },
): Cursor<HydratedDocument<IAgentChatDocument>> {
  const {
    workspace,
    project,
    agent,
    status,
    ...__filter
  } = filter || {}

  const conditions: any = {
    ...(workspace ? { workspace: new ObjectId(workspace) } : {}),
    ...(project ? { project: new ObjectId(project) } : {}),
    ...(agent ? { agent: new ObjectId(agent) } : {}),
    ...__filter,
    ...status ? {
      status: Array.isArray(status)
        ? { $in: status }
        : status,
    } : {},
  }

  return this.find(conditions).cursor()
}

AgentChatSchema.statics.pushAttachedDebugSession = function (
  chatId: string | ObjectId,
  debugSessionId: string,
) {
  return this.findOneAndUpdate(
    { _id: new ObjectId(chatId) },
    { $addToSet: { 'metadata.attachedDebugSessions': { _id: new ObjectId(debugSessionId) } } },
    { new: true },
  )
}

AgentChatSchema.statics.pullAttachedDebugSession = function (
  chatId: string | ObjectId,
  debugSessionId: string,
) {
  return this.findOneAndUpdate(
    { _id: new ObjectId(chatId) },
    { $pull: { 'metadata.attachedDebugSessions': { _id: new ObjectId(debugSessionId) } } },
    { new: true },
  )
}

AgentChatSchema.statics.removeDebugSessionReferences = async function (debugSessionId: string) {
  const id = new ObjectId(debugSessionId)
  await Promise.all([
    this.updateMany(
      { 'metadata.debugSession._id': id },
      { $unset: { 'metadata.debugSession': '' } },
    ),
    this.updateMany(
      { 'metadata.attachedDebugSessions._id': id },
      { $pull: { 'metadata.attachedDebugSessions': { _id: id } } },
    ),
  ])
}

AgentChatSchema.statics.findChatsWithDebugSession = function (debugSessionId: string) {
  const id = new ObjectId(debugSessionId)
  return this.find({
    $or: [
      { 'metadata.debugSession._id': id },
      { 'metadata.attachedDebugSessions._id': id },
    ],
  }).lean()
}

AgentChatSchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    ret.id = ret._id

    return ret
  },
})

AgentChatSchema.set('toObject', {
  transform: function (doc, ret, opt) {
    ret.id = ret._id

    return ret
  },
})

export const AgentChatModel = mongoose.model<IAgentChatDocument, IAgentChatModel>(
  'Agent-Chat',
  AgentChatSchema,
)
