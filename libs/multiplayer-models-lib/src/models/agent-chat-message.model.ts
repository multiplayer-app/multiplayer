import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IAgentChatMessage,
  AgentChatMessageRole,
  DataWithCursor,
  ICursor,
} from '@multiplayer/types'
import { ISortOptions } from '../types'

const { Schema } = mongoose

export interface IAgentChatMessageDocument
  extends Omit<IAgentChatMessage, '_id'>,
  Document {
  _id: ObjectId;
  toObject(): IAgentChatMessage;
  toJSON(): IAgentChatMessage;
}

export interface IAgentChatMessageModel
  extends Model<IAgentChatMessageDocument> {
  createMessage(
    payload: Partial<IAgentChatMessage>
  ): Promise<IAgentChatMessageDocument>;
  upsertMessage(
    payload: Partial<IAgentChatMessage> & { _id: string }
  ): Promise<IAgentChatMessageDocument>;

  findMessages(
    filter: {
      workspace: string | ObjectId;
      project: string | ObjectId;
      chat: string | ObjectId;
      beforeMessage?: string | ObjectId;
    },
    cursor?: ICursor,
    sort?: ISortOptions
  ): Promise<DataWithCursor<IAgentChatMessageDocument>>;
}

const AgentChatMessageSchema = new Schema(
  {
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

    chat: {
      type: ObjectId,
      ref: 'Agent-Chat',
      required: true,
      index: true,
    },

    workspaceUser: {
      type: ObjectId,
      ref: 'Workspace-User',
    },

    role: {
      type: String,
      enum: [...Object.values(AgentChatMessageRole), 'agent'],
      required: true,
    },
    content: {
      type: String,
      // required: true,
      default: '',
    },

    reasoning: {
      type: String,
    },
    toolCalls: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    attachments: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    annotations: {
      type: Schema.Types.Mixed,
    },
    tokens: {
      type: Number,
    },
    activity: {
      type: String,
    },
    agentName: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

AgentChatMessageSchema.statics.createMessage = function (
  payload: Partial<IAgentChatMessage>,
) {
  return new this(payload).save()
}

AgentChatMessageSchema.statics.upsertMessage = function (
  payload: Partial<IAgentChatMessage> & { _id: string },
) {
  const { _id, workspace, project, chat, toolCalls, ...rest } = payload as any

  if (!toolCalls || toolCalls.length === 0) {
    return this.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      {
        $set: {
          ...rest,
          ...(_id ? { _id: new ObjectId(_id) } : {}),
          ...(chat ? { chat: new ObjectId(chat) } : {}),
          ...(workspace ? { workspace: new ObjectId(workspace) } : {}),
          ...(project ? { project: new ObjectId(project) } : {}),
        },
      },
      { upsert: true, new: true },
    )
  }

  const incomingIds = toolCalls.map((tc: any) => tc.id)

  // Aggregation pipeline update: atomically merge tool calls —
  // update existing entries by id, append new ones
  return this.findOneAndUpdate(
    { _id: new ObjectId(_id) },
    [
      {
        $set: {
          ...rest,
          ...(_id ? { _id: new ObjectId(_id) } : {}),
          ...(workspace ? { workspace: new ObjectId(workspace) } : {}),
          ...(project ? { project: new ObjectId(project) } : {}),
          ...(chat ? { chat: new ObjectId(chat) } : {}),
          toolCalls: {
            $concatArrays: [
              {
                $map: {
                  input: { $ifNull: ['$toolCalls', []] },
                  as: 'existing',
                  in: {
                    $cond: {
                      if: { $in: ['$$existing.id', incomingIds] },
                      then: {
                        $arrayElemAt: [
                          { $literal: toolCalls },
                          { $indexOfArray: [incomingIds, '$$existing.id'] },
                        ],
                      },
                      else: '$$existing',
                    },
                  },
                },
              },
              {
                $filter: {
                  input: { $literal: toolCalls },
                  as: 'incoming',
                  cond: {
                    $not: {
                      $in: [
                        '$$incoming.id',
                        {
                          $map: {
                            input: { $ifNull: ['$toolCalls', []] },
                            as: 'e',
                            in: '$$e.id',
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ],
    { upsert: true, new: true },
  )
}

AgentChatMessageSchema.statics.findMessages = async function (
  filter: {
    workspace: string | ObjectId;
    project: string | ObjectId;
    chat: string | ObjectId;
    beforeMessage?: string | ObjectId;
  },
  cursor?: ICursor,
  sort?: ISortOptions,
) {
  const _sort: any = {}
  let _cursor: any = {}
  let sortKey = '_id'
  let sortDirection = -1

  if (sort?.sortKey) {
    sortKey = sort.sortKey
    sortDirection = sort.sortDirection === 1 ? 1 : -1
    _sort[sortKey] = sortDirection
  } else {
    _sort['_id'] = -1
  }

  if (typeof cursor?.skip === 'number' || typeof cursor?.limit === 'number') {
    _cursor = cursor
  }

  const { workspace, project, chat, beforeMessage, ..._filter } = filter

  const workspaceId = new ObjectId(workspace)
  const projectId = new ObjectId(project)
  const chatId = new ObjectId(chat)

  const conditions: any = {
    ..._filter,
    workspace: workspaceId,
    project: projectId,
    chat: chatId,
  }

  const pipeline: any[] = [
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(beforeMessage
            ? [{ $match: { _id: { $lt: new ObjectId(beforeMessage) } } }]
            : []),
          ...(typeof _cursor?.skip === 'number'
            ? [{ $skip: _cursor.skip }]
            : []),
          ...(typeof _cursor?.limit === 'number'
            ? [{ $limit: _cursor.limit }]
            : []),
          {
            $addFields: {
              id: '$_id',
            },
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ],
      },
    },
  ]

  const [
    {
      items,
      count: [{ count } = { count: 0 }],
    },
  ] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor?.skip,
      limit: cursor?.limit,
    },
  }
}

AgentChatMessageSchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    ret.id = ret._id

    return ret
  },
})

AgentChatMessageSchema.set('toObject', {
  transform: function (doc, ret, opt) {
    ret.id = ret._id

    return ret
  },
})

AgentChatMessageSchema.index({ workspace: 1, project: 1, chat: 1 })

export const AgentChatMessageModel = mongoose.model<
IAgentChatMessageDocument,
IAgentChatMessageModel
>('Agent-Chat-Message', AgentChatMessageSchema)
