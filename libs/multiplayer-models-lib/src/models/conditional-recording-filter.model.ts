import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IConditionalRecordingFilters,
  ICursor,
  DataWithCursor,
  SessionRecordingMode,
  RemoteSessionRecordingConditionCompareOperator,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { ISortOptions } from '../types'
import { SessionRecordingOptionsSchema } from './shared/session-recording-options.model'

const { Schema } = mongoose

export interface IConditionalRecoringFiltersDocument extends Omit<IConditionalRecordingFilters, '_id'>, Document {
  _id: ObjectId

  toObject(): IConditionalRecordingFilters
  toJSON(): IConditionalRecordingFilters
}

export interface IConditionalRecordingFiltersModel extends Model<IConditionalRecoringFiltersDocument> {
  createConditionalRecordingFilters(
    payload: Partial<IConditionalRecordingFilters>
  ): Promise<IConditionalRecoringFiltersDocument>

  findConditionalRecordingFiltersById(
    id: string | ObjectId
  ): Promise<IConditionalRecoringFiltersDocument | undefined>

  findConditionalRecordingFiltersByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IConditionalRecoringFiltersDocument | undefined>

  findConditionalRecordingFilters(
    filter: {
      _id?: string | ObjectId | string[] | ObjectId[]
      workspace: string | ObjectId,
      project: string | ObjectId,
      name?: string,
      enabled?: boolean,
      startConditionsAttributePath?: string[]
    },
    cursor?: ICursor,
    sort?: ISortOptions,
    $project?: any
  ): Promise<DataWithCursor<IConditionalRecoringFiltersDocument>>

  updateConditionalRecordingFiltersById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Partial<IConditionalRecordingFilters>
  ): Promise<IConditionalRecoringFiltersDocument | undefined>

  deleteConditionalRecordingFiltersByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteConditionalRecordingFiltersByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deleteConditionalRecordingFiltersById(
    id: string | ObjectId,
  ): Promise<void>
}

const ConditionalRecordingFiltersSchema = new Schema({
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
    required: true,
  },

  description: {
    type: String,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  samplingRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  mode: {
    type: String,
    required: true,
    enum: Object.values(SessionRecordingMode),
  },

  conditions: {
    autoStartOnError: {
      type: Boolean,
    },

    start: [{
      attributePath: {
        type: String,
      },
      conditionType: {
        type: String,
        enum: Object.values(RemoteSessionRecordingConditionCompareOperator),
      },
      value: {
        type: String,
      },
    }],
    stop: {
      idleTime: {
        type: Number, // time in ms
        min: 1,
      },
      maxTime: {
        type: Number, // time in ms
        min: 1,
      },
    },
  },

  recordingOptions: SessionRecordingOptionsSchema,
}, {
  timestamps: true,
})

ConditionalRecordingFiltersSchema.statics.createConditionalRecordingFilters = async function (
  payload: Partial<IConditionalRecordingFilters>,
) {
  return new this(payload).save()
}

ConditionalRecordingFiltersSchema.statics.findConditionalRecordingFiltersById = function (
  id: string | ObjectId,
) {
  return this.findOne({ _id: id })
}

ConditionalRecordingFiltersSchema.statics.findConditionalRecordingFiltersByIdAndProjectAndWorkspace = function (
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

ConditionalRecordingFiltersSchema.statics.findConditionalRecordingFilters = async function (
  filter: {
    _id?: string | ObjectId | string[] | ObjectId[]
    workspace: string | ObjectId,
    project: string | ObjectId,
    name?: string,
    enabled?: boolean,
    startConditionsAttributePath?: string[]
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

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (filter._id) {
    conditions._id = Array.isArray(filter._id)
      ? { $in: filter._id.map(_id => new ObjectId(_id)) }
      : new ObjectId(filter._id)
  }

  if (filter.name) {
    conditions.name = {
      $regex: new RegExp(filter.name, 'i'),
    }
  }

  if ('enabled' in filter) {
    conditions.enabled = filter.enabled
  }

  if (filter.startConditionsAttributePath?.length) {
    conditions['conditions.start'] = {
      $all: filter.startConditionsAttributePath.map(attributePath => ({
        $elemMatch: { attributePath },
      })),
    }
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

ConditionalRecordingFiltersSchema.statics.updateConditionalRecordingFiltersById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Partial<IConditionalRecordingFilters>,
): Promise<IConditionalRecoringFiltersDocument | undefined> {
  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.prepareUpdateParams(_payload)
  const update = {
    $set: set,
    $unset: unset,
  }

  return this.findOneAndUpdate(
    {
      _id: id,
      workspace: workspaceId,
      project: projectId,
    },
    update,
    {
      new: true,
      runValidators: true,
    },
  )
}

ConditionalRecordingFiltersSchema.statics.deleteConditionalRecordingFiltersByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ConditionalRecordingFiltersSchema.statics.deleteConditionalRecordingFiltersByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

ConditionalRecordingFiltersSchema.statics.deleteConditionalRecordingFiltersById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

ConditionalRecordingFiltersSchema.index({
  workspace: 1,
  project: 1,
})

export const ConditionalRecordingFiltersModel = mongoose.model<
IConditionalRecoringFiltersDocument,
IConditionalRecordingFiltersModel
>('Conditional-Recording-Filters', ConditionalRecordingFiltersSchema)
