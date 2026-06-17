import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, Cursor, HydratedDocument } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import { IAgent, AgentType, DataWithCursor, ICursor } from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IAgentDocument extends Omit<IAgent, '_id'>, Document {
  _id: ObjectId;

  toObject(): IAgent;
  toJSON(): IAgent;
}

export interface IAgentModel extends Model<IAgentDocument> {
  createAgent(payload: Partial<IAgentDocument>): Promise<IAgentDocument>;

  findAgentById(id: string | ObjectId): Promise<IAgentDocument | undefined>;

  findAgentByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IAgentDocument | undefined>;

  findAgents(
    filter: {
      workspace: string | ObjectId;
      project: string | ObjectId;
      type?: AgentType;
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IAgentDocument>>;

  updateAgentById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IAgent>,
  ): Promise<IAgentDocument | undefined>;

  deleteAgentById(id: string | ObjectId): Promise<void>;

  deleteAgentBySocketId(socketId: string): Promise<void>;

  deleteAgentByWorkspace(workspaceId: string | ObjectId): Promise<void>;

  findAgentsCursor(filter?: {
    workspace?: string | ObjectId;
    project?: string | ObjectId;
    type?: AgentType;
  }): Cursor<HydratedDocument<IAgentDocument>>;

  findAgentWithAvailableSlot(filter: {
    workspaceId: string | ObjectId;
    projectId: string | ObjectId;
    workspaceUser?: string | ObjectId;
    componentName?: string;
    environmentName?: string;
  }): Promise<IAgentDocument | null>;

  claimIssueCapacitySlot(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    agentId: string | ObjectId,
  ): Promise<IAgentDocument | null>;

  releaseIssueCapacitySlot(id: string | ObjectId): Promise<void>;

  incrementConsecutiveTimeouts(id: string | ObjectId): Promise<IAgentDocument | null>;

  resetConsecutiveTimeouts(id: string | ObjectId): Promise<void>;

  markAgentErrored(id: string | ObjectId): Promise<void>;
}

const AgentSchema = new Schema(
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
    socketId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(AgentType),
      required: true,
    },
    maxConcurrentIssues: {
      type: Number,
      default: 2,
    },
    issuesInProgress: {
      type: Number,
      default: 0,
    },
    consecutiveTimeouts: {
      type: Number,
      default: 0,
    },
    errored: {
      type: Boolean,
      default: false,
    },
    contextPath: {
      type: String,
    },
    noGitBranch: {
      type: Boolean,
      default: false,
    },
    model: {
      type: String,
    },
    availableModels: {
      type: [String],
      default: [],
    },
    workspaceUser: {
      type: ObjectId,
      ref: 'Workspace-User',
      required: true,
    },
    settings: {
      issueSubscription: {
        componentName: {
          type: [String],
        },
        environmentName: {
          type: [String],
        },
      },
      autoResolveIssues: {
        type: Boolean,
      },
      fixabilityScoreThreshold: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  },
)

AgentSchema.statics.createAgent = function (payload: Partial<IAgent>) {
  return new this(payload).save()
}

AgentSchema.statics.findAgentById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

AgentSchema.statics.findAgentByIdAndProjectAndWorkspace = function (
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

AgentSchema.statics.findAgents = async function (
  filter: {
    workspace: string | ObjectId;
    project: string | ObjectId;
    type?: AgentType;
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const { workspace, project, ..._filter } = filter

  const conditions: any = {
    ..._filter,
    workspace: new ObjectId(workspace),
    project: new ObjectId(project),
  }

  const [
    {
      items,
      count: [{ count } = { count: 0 }],
    },
  ] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(typeof cursor?.skip === 'number' &&
            typeof cursor?.limit === 'number'
            ? [{ $skip: cursor.skip }, { $limit: cursor.limit }]
            : []),
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

AgentSchema.statics.updateAgentById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IAgent>,
): Promise<IAgentDocument | undefined> {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    {
      _id: id,
      workspace: workspaceId,
      project: projectId,
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

AgentSchema.statics.deleteAgentById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

AgentSchema.statics.deleteAgentBySocketId = function (
  socketId: string,
): Promise<void> {
  return this.deleteOne({
    socketId,
  })
}

AgentSchema.statics.deleteAgentByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

AgentSchema.statics.findAgentsCursor = function (
  filter: {
    workspace?: string | ObjectId;
    project?: string | ObjectId;
    type?: AgentType;
  } = {},
): any {
  const { workspace, project, ..._filter } = filter

  const conditions: any = {
    ..._filter,
    ...(workspace ? { workspace: new ObjectId(workspace) } : {}),
    ...(project ? { project: new ObjectId(project) } : {}),
  }

  return this.find(conditions).cursor()
}

AgentSchema.statics.findAgentWithAvailableSlot = function (filter: {
  workspaceId: string | ObjectId;
  projectId: string | ObjectId;
  workspaceUser?: string | ObjectId;
  componentName?: string;
  environmentName?: string;
}): Promise<IAgentDocument | null> {
  const conditions: {
    workspace: ObjectId;
    project: ObjectId;
    workspaceUser?: ObjectId;
    errored?: boolean | Record<string, unknown>;
    $expr: any;
    $and?: any[];
  } = {
    workspace: new ObjectId(filter.workspaceId),
    project: new ObjectId(filter.projectId),
    // type: AgentType.DEBUGGING,
    errored: { $ne: true },
    ...(
      filter.workspaceUser
        ? { workspaceUser: new ObjectId(filter.workspaceUser) }
        : {}
    ),
    $expr: {
      $lt: [
        { $ifNull: ['$issuesInProgress', 0] },
        { $ifNull: ['$maxConcurrentIssues', 2] },
      ],
    },
    $and: [] as any[],
  }

  conditions.$and = []

  if (filter.componentName) {
    conditions.$and.push({
      $or: [{
        'settings.issueSubscription.componentName': filter.componentName,
      }, {
        'settings.issueSubscription.componentName': { $exists: false },
      }, {
        'settings.issueSubscription.componentName': {
          $exists: true,
          $size: 0,
        },
      }],
    })
  }

  if (filter.environmentName) {
    conditions.$and.push({
      $or: [{
        'settings.issueSubscription.environmentName': filter.environmentName,
      }, {
        'settings.issueSubscription.environmentName': { $exists: false },
      }, {
        'settings.issueSubscription.environmentName': {
          $exists: true,
          $size: 0,
        },
      }],
    })
  }

  if (conditions.$and.length === 0) {
    delete conditions.$and
  }

  return this.findOneAndUpdate(
    conditions,
    { $inc: { issuesInProgress: 1 } },
    { new: true },
  )
}

AgentSchema.statics.claimIssueCapacitySlot = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  agentId: string | ObjectId,
): Promise<IAgentDocument | null> {
  return this.findOneAndUpdate(
    {
      _id: new ObjectId(agentId),
      workspace: new ObjectId(workspaceId),
      project: new ObjectId(projectId),
    },
    {
      $inc: {
        issuesInProgress: 1,
      },
    },
    { new: true },
  )
}

AgentSchema.statics.releaseIssueCapacitySlot = function (
  id: string | ObjectId,
): Promise<void> {
  return this.findOneAndUpdate(
    {
      _id: id,
      issuesInProgress: { $gt: 0 },
    },
    {
      $inc: {
        issuesInProgress: -1,
      },
    },
  )
}

AgentSchema.statics.incrementConsecutiveTimeouts = function (
  id: string | ObjectId,
): Promise<IAgentDocument | null> {
  return this.findOneAndUpdate(
    { _id: id },
    { $inc: { consecutiveTimeouts: 1 } },
    { new: true },
  )
}

AgentSchema.statics.resetConsecutiveTimeouts = function (
  id: string | ObjectId,
): Promise<void> {
  return this.updateOne(
    { _id: id },
    { $set: { consecutiveTimeouts: 0 } },
  )
}

AgentSchema.statics.markAgentErrored = function (
  id: string | ObjectId,
): Promise<void> {
  return this.updateOne(
    { _id: id },
    { $set: { errored: true } },
  )
}

AgentSchema.index({
  workspace: 1,
  project: 1,
})

export const AgentModel = mongoose.model<IAgentDocument, IAgentModel>(
  'Agent',
  AgentSchema,
)
