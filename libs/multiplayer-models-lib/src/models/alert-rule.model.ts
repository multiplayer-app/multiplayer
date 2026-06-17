import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IAlertRule,
  AlertRuleConditionType,
  AlertRuleFilterType,
  AlertRuleActionType,
  DataWithCursor,
  ICursor,
  AlertRuleFilterCondition,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IAlertRuleDocument extends Omit<IAlertRule, '_id'>, Document {
  _id: ObjectId

  toObject(): IAlertRuleDocument
  toJSON(): IAlertRule
}

export interface IAlertRuleModel extends Model<IAlertRuleDocument> {
  createAlertRule(
    payload: Partial<IAlertRuleDocument>
  ): Promise<IAlertRuleDocument>

  findAlertRuleById(
    id: string | ObjectId
  ): Promise<IAlertRuleDocument | undefined>

  findAlertRuleByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IAlertRuleDocument | undefined>

  findAlertRules(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      enabled?: boolean,
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IAlertRuleDocument>>

  updateAlertRuleById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IAlertRule>,
  ): Promise<IAlertRuleDocument | undefined>

  deleteAlertRuleById(
    id: string | ObjectId,
  ): Promise<void>

  deleteAlertRulesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteActionsByIntegration(
    integrationId: string | ObjectId,
  ): Promise<void>
}

const AlertRuleSchema = new Schema({
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
  name: {
    type: String,
  },
  enabled: {
    type: Boolean,
  },
  scope: {
    environmentName: {
      type: String,
    },
    componentName: {
      type: String,
    },
  },
  conditionOperator: {
    type: String,
    enum: ['ALL', 'ANY'],
    required: true,
  },
  conditions: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleConditionType),
      required: true,
    },
    interval: {
      type: String,
    },
    value: {
      type: String,
    },
  }],
  filterOperator: {
    type: String,
    enum: ['ALL', 'ANY', 'NONE'],
    required: true,
  },
  filters: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleFilterType),
      required: true,
    },
    match: {
      type: String,
      enum: Object.values(AlertRuleFilterCondition),
    },
    attribute: {
      type: String,
    },
    interval: {
      type: String,
    },
    value: {
      type: String,
    },
  }],
  actions: [{
    type: {
      type: String,
      enum: Object.values(AlertRuleActionType),
      required: true,
    },
    integration: {
      type: ObjectId,
      ref: 'Integrations',
    },
    slack: {
      channelId: {
        type: String,
      },
      channelName: {
        type: String,
      },
      workspace: {
        type: String,
      },
      notes: {
        type: String,
      },
      tags: {
        type: String,
      },
    },
  }],
}, {
  timestamps: true,
})

AlertRuleSchema.statics.createAlertRule = function (
  payload: Partial<IAlertRule>,
) {
  return this.findOneAndUpdate(
    payload,
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

AlertRuleSchema.statics.findAlertRuleById = function(id: string | ObjectId) {
  return this.findOne({ _id: id })
}

AlertRuleSchema.statics.findAlertRuleByIdAndProjectAndWorkspace = function(
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

AlertRuleSchema.statics.findAlertRules = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    enabled?: boolean,
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

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (typeof filter.enabled === 'boolean') {
    conditions.enabled = !filter.enabled ? { $ne: true } : true
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

AlertRuleSchema.statics.updateAlertRuleById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IAlertRule>,
): Promise<IAlertRuleDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
      workspace: workspaceId,
      project: projectId,
    },
    {
      $set: {
        ...payload,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

AlertRuleSchema.statics.deleteAlertRuleById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

AlertRuleSchema.statics.deleteAlertRulesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

AlertRuleSchema.statics.deleteActionsByIntegration = function (
  integrationId: string | ObjectId,
): Promise<void> {
  return this.updateMany(
    {
      'actions.integration': new ObjectId(integrationId),
    },
    { $pull: { actions: { integration: integrationId } } },
  )
}

AlertRuleSchema.index({
  workspace: 1,
  project: 1,
})

export const AlertRuleModel = mongoose.model<IAlertRuleDocument, IAlertRuleModel>(
  'Alert-Rule',
  AlertRuleSchema,
)
