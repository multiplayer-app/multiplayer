import { mongoose, encryption, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { Model } from 'mongoose'
import {
  IIntegration,
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  ICursor,
  DataWithCursor,
  ProjectBranchStatus,
  IntegrationTypeConfigPropertyName,
  OtelAgentSelectionMode,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'
import { IWorkspaceUserDocument } from './workspace-user.model'

const { Schema } = mongoose

export interface IIntegrationDocument extends Omit<IIntegration, '_id' | 'workspaceUser' | 'workspace'>, Document {
  _id: ObjectId | string

  workspace: string | ObjectId

  workspaceUser: string | ObjectId

  createdAt: Date

  updatedAt: Date

  toObject(): IIntegrationDocument
}

export interface IIntegrationModel extends Model<IIntegrationDocument> {
  createIntegration(
    payload: Partial<IIntegrationDocument>
  ): Promise<IIntegrationDocument>

  findIntegrationById(
    id: string | ObjectId
  ): Promise<IIntegrationDocument | undefined>

  findIntegrationByGithubInstallationId(
    installationId: number
  ): Promise<IIntegrationDocument | undefined>

  findIntegrationByUserAndType(
    workspaceUserIds: string[] | ObjectId[],
    type: IntegrationTypeEnum,
    authType: IntegrationAuthTypeEnum
  ): Promise<IIntegrationDocument | undefined>

  findIntegrationByIdAndType(
    _id: string | ObjectId,
    integrationType: IntegrationTypeEnum
  ): Promise<IIntegrationDocument | undefined>

  findIntegrationByIdInWorkspace(
    id: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IIntegrationDocument | undefined>

  findIntegrationInWorkspace(
    workspaceId: string | ObjectId,
    integrationType: IntegrationTypeEnum
  ): Promise<IIntegrationDocument | undefined>

  findIntegrations(
    filter: {
      workspace: string | ObjectId,
      project?: string | ObjectId,
      type?: IntegrationTypeEnum | IntegrationTypeEnum[],
      otelAgentSelectionMode?: OtelAgentSelectionMode,
      workspaceUser?: string | ObjectId,
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<IIntegrationDocument>>

  findIntegrationBySlackTeamId(teamId: string): Promise<IIntegrationDocument | undefined>

  updateIntegrationById(
    id: string | ObjectId,
    payload: Partial<IIntegrationDocument>
  ): Promise<IIntegrationDocument | undefined>

  deleteIntegrationById(id: string | ObjectId): Promise<void>

  deleteIntegrationByGithubInstallationId(installationId: number): Promise<void>

  deleteIntegrationBySlackTeamId(teamId: string): Promise<void>

  getWorkspaceUserByIntegrationAndUserId(
    integration: string | ObjectId,
    userId: string | ObjectId
  ): Promise<IWorkspaceUserDocument | undefined>

  deleteIntegrationsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteIntegrationsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>
}

const IntegrationSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
  },
  workspaceRole: {
    type: ObjectId,
    ref: 'Role',
  },
  projectRole: {
    type: ObjectId,
    ref: 'Role',
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(IntegrationTypeEnum),
  },
  authType: {
    type: String,
    enum: Object.values(IntegrationAuthTypeEnum),
  },
  workspaceUser: {
    type: ObjectId,
    required: true,
    ref: 'Workspace-User',
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },

  gitlab: {
    integrationSettingsUrl: {
      type: String,
    },
    accessToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    refreshToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
  },

  github: {
    accessToken: {
      type: String,
    },
    installationId: {
      type: String,
    },
    integrationSettingsUrl: {
      type: String,
    },
    orgId: {
      type: String,
    },
    orgName: {
      type: String,
    },
  },

  bitbucket: {
    integrationSettingsUrl: {
      type: String,
    },
    accessToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    refreshToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
  },

  atlassian: {
    accessToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    refreshToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    email: {
      type: String,
    },
    orgId: {
      type: String,
    },

    ticketStatusMapping: [{
      projectBranchStatus: {
        type: String,
        enum: Object.values(ProjectBranchStatus),
      },
      ticketStatus: {
        type: String,
      },
    }],
  },

  linear: {
    accessToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    ticketStatusMapping: [{
      projectBranchStatus: {
        type: String,
        enum: Object.values(ProjectBranchStatus),
      },
      ticketStatus: {
        type: String,
      },
    }],
  },

  apiKey: {
    apiKey: {
      type: String,
    },
  },

  otel: {
    apiKey: {
      type: String,
    },
    autoMergeEnabled: {
      type: Boolean,
    },
    autoCreateRelease: {
      type: Boolean,
    },
    agentSelectionMode: {
      type: String,
      enum: Object.values(OtelAgentSelectionMode),
      default: OtelAgentSelectionMode.ANY,
    },
    autoResolveIssues: {
      type: Boolean,
      default: true,
    },
    autoCreateIssues: {
      type: Boolean,
      default: true,
    },
  },

  shareApiKey: {
    apiKey: {
      type: String,
    },
  },

  slack: {
    accessToken: {
      type: Schema.Types.Mixed,
      cast: false,
    },
    incomingWebhook: {
      type: String,
    },
    integrationSettingsUrl: {
      type: String,
    },
    enterpriseId: {
      type: String,
    },
    teamId: {
      type: String,
    },
    configurationUrl: {
      type: String,
    },
    teamName: {
      type: String,
    },
  },


  expireAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

IntegrationSchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    delete ret?.gitlab?.accessToken
    delete ret?.gitlab?.refreshToken

    delete ret?.github?.accessToken
    delete ret?.github?.refreshToken

    delete ret?.bitbucket?.accessToken
    delete ret?.bitbucket?.refreshToken

    delete ret?.atlassian?.accessToken
    delete ret?.atlassian?.refreshToken

    delete ret?.linear?.accessToken

    delete ret?.apiKey?.apiKey

    delete ret?.otel?.apiKey

    delete ret?.shareApiKey?.apiKey

    delete ret?.slack?.apiKey

    return ret
  },
})

IntegrationSchema.statics.createIntegration = async function (
  payload: any,
) {
  if (payload?.gitlab?.accessToken) {
    payload.gitlab.accessToken = await encryption.encrypt(payload.gitlab.accessToken)
  }
  if (payload?.gitlab?.refreshToken) {
    payload.gitlab.accessToken = await encryption.encrypt(payload.gitlab.accessToken)
  }

  if (payload?.github?.accessToken) {
    payload.github.accessToken = await encryption.encrypt(payload.github.accessToken)
  }
  if (payload?.github?.refreshToken) {
    payload.github.accessToken = await encryption.encrypt(payload.github.accessToken)
  }

  if (payload?.bitbucket?.accessToken) {
    payload.bitbucket.accessToken = await encryption.encrypt(payload.bitbucket.accessToken)
  }
  if (payload?.bitbucket?.refreshToken) {
    payload.bitbucket.accessToken = await encryption.encrypt(payload.bitbucket.accessToken)
  }

  if (payload?.atlassian?.accessToken) {
    payload.atlassian.accessToken = await encryption.encrypt(payload.atlassian.accessToken)
  }
  if (payload?.atlassian?.refreshToken) {
    payload.atlassian.accessToken = await encryption.encrypt(payload.atlassian.accessToken)
  }

  if (payload?.linear?.accessToken) {
    payload.linear.accessToken = await encryption.encrypt(payload.linear.accessToken)
  }

  if (payload?.apiKey?.apiKey) {
    payload.apiKey.apiKey = await encryption.encrypt(payload.apiKey.apiKey)
  }

  if (payload?.otel?.apiKey) {
    payload.otel.apiKey = await encryption.encrypt(payload.otel.apiKey)
  }

  if (payload?.shareApiKey?.apiKey) {
    payload.shareApiKey.apiKey = await encryption.encrypt(payload.shareApiKey.apiKey)
  }

  if (payload?.slack?.apiKey) {
    payload.slack.apiKey = await encryption.encrypt(payload.slack.apiKey)
  }

  return new this(payload).save()
}

IntegrationSchema.statics.findIntegrationById = function (
  id: string | ObjectId,
) {
  const conditions: any = {
    _id: id,
  }

  return this.findOne(conditions)
}

IntegrationSchema.statics.findIntegrationByGithubInstallationId = function (
  installationId: number,
): Promise<IIntegrationDocument | undefined> {
  const conditions: any = {
    'github.installationId': installationId,
  }

  return this.findOne(conditions)
}


IntegrationSchema.statics.findIntegrationByUserAndType = function (
  workspaceUserIds: string[] | ObjectId[],
  type: IntegrationTypeEnum,
  authType: IntegrationAuthTypeEnum,
): Promise<IIntegrationDocument | undefined> {
  const conditions: any = {
    workspaceUser: { $in: workspaceUserIds },
    type,
    authType,
  }

  return this.findOne(conditions)
}

IntegrationSchema.statics.findIntegrationByIdAndType = function (
  id: string | ObjectId,
  integrationType: IntegrationTypeEnum,
) {
  const conditions: any = {
    _id: new ObjectId(id),
    type: integrationType,
  }

  return this.findOne(conditions)
}

IntegrationSchema.statics.findIntegrationByIdInWorkspace = function (
  id: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
  })
}

IntegrationSchema.statics.findIntegrationInWorkspace = function (
  workspaceId: string | ObjectId,
  integrationType: IntegrationTypeEnum,
): Promise<IIntegrationDocument | undefined> {
  const conditions: any = {
    workspace: workspaceId,
    type: integrationType,
  }

  return this.findOne(conditions)
}

IntegrationSchema.statics.findIntegrations = async function (
  filter: {
    workspace: string | ObjectId,
    project?: string | ObjectId,
    type?: IntegrationTypeEnum | IntegrationTypeEnum[],
    otelAgentSelectionMode?: OtelAgentSelectionMode,
    workspaceUser?: string | ObjectId,
  },
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
  }

  if (filter.type) {
    conditions.type = Array.isArray(filter.type)
      ? { $in: filter.type }
      : filter.type
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.otelAgentSelectionMode) {
    conditions['otel.agentSelectionMode'] = filter.otelAgentSelectionMode
  }

  if (filter.workspaceUser) {
    conditions.workspaceUser = new ObjectId(filter.workspaceUser)
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
          ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
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

IntegrationSchema.statics.findIntegrationBySlackTeamId = async function (teamId: string): Promise<IIntegrationDocument | undefined> {
  const conditions: any = {
    'slack.teamId': teamId,
  }

  return this.findOne(conditions)
}

IntegrationSchema.statics.updateIntegrationById = async function (
  id: string | ObjectId,
  payload: any,
) {
  const _payload = MongoPayload.flattenObject(payload)

  for (const key of Object.keys(_payload)) {
    if (
      key.endsWith('.accessToken')
      || key.endsWith('.refreshToken')
      || key.endsWith('.apiKey')
    ) {
      _payload[key] = await encryption.encrypt(_payload[key])
    }
  }

  return this.findOneAndUpdate(
    {
      _id: id,
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

IntegrationSchema.statics.deleteIntegrationById = function (id: string | ObjectId) {
  const conditions: any = {
    _id: id,
  }

  return this.deleteOne(conditions)
}

IntegrationSchema.statics.deleteIntegrationByGithubInstallationId = function (
  installationId: number,
): Promise<void> {
  const conditions: any = {
    'github.installationId': installationId,
  }

  return this.deleteMany(conditions)
}

IntegrationSchema.statics.deleteIntegrationBySlackTeamId = function (
  teamId: number,
): Promise<void> {
  const conditions: any = {
    'slack.teamId': teamId,
  }

  return this.deleteMany(conditions)
}

IntegrationSchema.statics.getWorkspaceUserByIntegrationAndUserId = async function (
  integrationId: string | ObjectId,
  userId: string | ObjectId,
): Promise<IWorkspaceUserDocument | undefined> {
  const res = await this.aggregate([
    {
      $match: {
        _id: new ObjectId(integrationId),
      },
    },
    {
      $lookup: {
        from: 'workspaces',
        localField: 'workspace',
        foreignField: '_id',
        as: 'workspace',
      },
    },
    {
      $unwind: '$workspace',
    },
    {
      $replaceRoot: {
        newRoot: '$workspace',
      },
    },
    {
      $lookup: {
        from: 'workspace-users',
        localField: '_id',
        foreignField: 'workspace',
        as: 'workspaceUser',
        pipeline: [{
          $match: {
            user: new ObjectId(userId),
          },
        }],
      },
    },
    {
      $unwind: '$workspaceUser',
    },
    {
      $replaceRoot: {
        newRoot: '$workspaceUser',
      },
    },
  ])

  return (res.length) ? res[0] : undefined
}

IntegrationSchema.statics.deleteIntegrationsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

IntegrationSchema.statics.deleteIntegrationsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

IntegrationSchema.index({
  'otel.apiKey': 1,
}, {
  unique: true,
  sparse: true,
})

IntegrationSchema.index({
  'apiKey.apiKey': 1,
}, {
  unique: true,
  sparse: true,
})

IntegrationSchema.index({
  'shareApiKey.apiKey': 1,
}, {
  unique: true,
  sparse: true,
})

IntegrationSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

export const IntegrationModel = mongoose.model<IIntegrationDocument, IIntegrationModel>('Integration', IntegrationSchema)
