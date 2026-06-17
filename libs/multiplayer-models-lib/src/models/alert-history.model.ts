import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IAlertHistory,
  DataWithCursor,
  ICursor,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IAlertHistoryDocument extends Omit<IAlertHistory, '_id'>, Document {
  _id: ObjectId

  toObject(): IAlertHistoryDocument
  toJSON(): IAlertHistory
}

export interface IAlertHistoryModel extends Model<IAlertHistoryDocument> {
  createAlertHistory(
    payload: Partial<IAlertHistoryDocument>
  ): Promise<IAlertHistoryDocument>

  findAlertHistoryByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IAlertHistoryDocument | undefined>

  findAlertHistory(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      alertRule?: string | ObjectId,
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IAlertHistoryDocument>>

  deleteAlertHistoryByAlertRuleId(
    alertRuleId: string | ObjectId,
  ): Promise<void>

  deleteAlertHistoryByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>
}

const AlertHistorySchema = new Schema({
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
  alertRule: {
    type: ObjectId,
    ref: 'Alert-Rule',
    required: true,
  },
}, {
  timestamps: true,
})

AlertHistorySchema.statics.createAlertHistory = function (
  payload: Partial<IAlertHistory>,
) {
  return new this(payload).save()
}

AlertHistorySchema.statics.findAlertHistoryByIdAndProjectAndWorkspace = function(
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

AlertHistorySchema.statics.findAlertHistory = async function (
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

AlertHistorySchema.statics.deleteAlertHistoryByAlertRuleId = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

AlertHistorySchema.statics.deleteAlertHistoryByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

AlertHistorySchema.index({
  workspace: 1,
  project: 1,
})

AlertHistorySchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90, // 90 days
  },
)

export const AlertHistoryModel = mongoose.model<IAlertHistoryDocument, IAlertHistoryModel>(
  'Alert-History',
  AlertHistorySchema,
)
