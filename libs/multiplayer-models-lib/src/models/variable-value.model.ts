import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, PipelineStage } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IVariableValue,
  EntityCommitChangeType,
  ICursor,
  DataWithCursor,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IVariableValueDocument extends Omit<IVariableValue, '_id' | 'variableValueId' | 'workspace' | 'project' | 'projectBranch' | 'createdAtCommit' | 'archivedAtCommit' | 'deletedAtCommit'>, Document {
  _id: ObjectId

  variableValueId: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId

  createdAtCommit: ObjectId | string

  archivedAtCommit: ObjectId | string

  deletedAtCommit: ObjectId | string

  toObject(): IVariableValueDocument
  toJSON(): IVariableValue
}

export interface IVariableValueModel extends Model<IVariableValueDocument> {
  createVariableValue(payload: object): Promise<IVariableValueDocument>

  getVariableValueById(
    variableValueId: string | ObjectId,
    projectBranchId: string | ObjectId | string[] | ObjectId[],
  ): Promise<IVariableValueDocument | undefined>

  getVariableValuesBySchema(
    variableSchemaId: string | ObjectId,
    projectBranchesId: string[] | ObjectId[],
  ): Promise<IVariableValueDocument[]>

  findVariableValue(
    filter: object,
    cursor?: ICursor
  ): Promise<DataWithCursor<IVariableValueDocument>>

  findVariableValueByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IVariableValueDocument | undefined>

  getVariableValueState(
    projectBranchTreeIds: string[] | ObjectId[],
    filter?: Partial<IVariableValue> & {
      archived?: boolean
      withDeleted?: boolean
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IVariableValueDocument>>

  updateVariableValueById(
    variableValueId: string | ObjectId,
    projectBranchId: string | ObjectId,
    payload: object
  ): Promise<IVariableValueDocument | undefined>

  deleteVariableValue(
    variableValueId: string | ObjectId,
    projectBranchId: string | ObjectId,
  ): Promise<void>

  getVariableValuesInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): any

  deleteVariableValuesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteVariableValuesByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deleteVariableValuesByProjectBranch(
    projectBranchId: string | ObjectId
  ): Promise<void>
}

const VariableValueSchema = new Schema({
  variableValueId: {
    type: ObjectId,
    required: true,
  },
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    required: true,
  },
  projectBranch: {
    type: ObjectId,
    ref: 'Project-Branch',
    required: true,
  },
  entity: {
    type: ObjectId,
    ref: 'Entity',
    required: true,
  },
  environment: {
    type: ObjectId,
    ref: 'Environment',
    required: true,
  },
  variableSchema: {
    type: ObjectId,
    ref: 'Variable-Schema',
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  typeOfChangeInBranch: {
    type: String,
    enum: Object.values(EntityCommitChangeType),
  },
  createdAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  archivedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  deletedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

VariableValueSchema.statics.createVariableValue = function (
  payload: object,
) {
  return new this(payload).save()
}

VariableValueSchema.statics.getVariableValueById = async function (
  variableValueId: string | ObjectId,
  projectBranchId: string | ObjectId | string[] | ObjectId[],
) {
  const [entity] = await this.find({
    variableValueId: new ObjectId(variableValueId),
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }).sort({
    _id: -1,
  }).limit(1)

  return entity
}

VariableValueSchema.statics.getVariableValuesBySchema = async function (
  variableSchemaId: string | ObjectId,
  projectBranchesId: string[] | ObjectId[],
) {
  const pipeline: PipelineStage[] = [{
    $match: {
      variableSchema: new ObjectId(variableSchemaId),
      projectBranch: {
        $in: projectBranchesId.map(projectBranchId => new ObjectId(projectBranchId)),
      },
    },
  }, {
    $group: {
      _id: '$variableValueId',
      variableValue: {
        $last: '$$ROOT',
      },
    },
  },
  {
    $replaceRoot: {
      newRoot: '$variableValue',
    },
  }]

  return this.aggregate(pipeline)
}

VariableValueSchema.statics.findVariableValue = async function (
  filter: any,
  cursor: ICursor = {},
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

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.projectBranch) {
    conditions.projectBranch = new ObjectId(filter.projectBranch)
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
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          { $project: { _id: 0 } },
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

VariableValueSchema.statics.updateVariableValueById = function (
  variableValueId: string | ObjectId,
  projectBranchId: string | ObjectId,
  payload: object,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)
  return this.findOneAndUpdate(
    {
      variableValueId,
      projectBranch: projectBranchId,
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

VariableValueSchema.statics.findVariableValueByIdAndProjectAndWorkspace = function(
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

VariableValueSchema.statics.getVariableValueState = async function(
  projectBranchTreeIds: string[] | ObjectId[],
  filter?: Partial<IVariableValue> & {
    archived?: boolean
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
): Promise<DataWithCursor<IVariableValue>> {
  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['_id'] = -1
  }

  const conditions: any = {
    projectBranch: {
      $in: projectBranchTreeIds.map(projectBranchId => new ObjectId(projectBranchId)),
    },
    deletedAtCommit: {
      $exists: false,
    },
  }

  if (mergeCommitId) {
    conditions.createdAtCommit = {
      $lt: new ObjectId(mergeCommitId),
    }
  }

  if (filter?.archived) {
    conditions.archivedAtCommit = { $exists: false }
  }

  if (filter?.project) {
    conditions.project = new ObjectId(filter.project)
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
      },
    },
    {
      $group: {
        _id: '$projectTagId',
        tag: {
          $last: '$$ROOT',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$$ROOT.tag',
      },
    },
    {
      $sort: _sort,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
          {
            $lookup: {
              from: 'tags',
              localField: 'tags',
              foreignField: '_id',
              as: 'tags',
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
      ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
      ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
    },
  }
}

VariableValueSchema.statics.deleteVariableValue = function (
  variableValueId: string | ObjectId,
  projectBranchId: string | ObjectId,
) {
  return this.deleteOne({
    variableValueId,
    projectBranch: projectBranchId,
  })
}

VariableValueSchema.statics.getVariableValuesInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

VariableValueSchema.statics.deleteVariableValuesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

VariableValueSchema.statics.deleteVariableValuesByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

VariableValueSchema.statics.deleteVariableValuesByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

VariableValueSchema.index(
  { project: 1, projectBranch: 1, variableValueId: 1 },
  { unique: true },
)

VariableValueSchema.index(
  { projectBranch: 1, variableValueId: 1 },
  { unique: true },
)

VariableValueSchema.index(
  { projectBranch: 1, variableValueId: 1, entity: 1 },
  { unique: true },
)

export const VariablesValueModel = mongoose.model<IVariableValue, IVariableValueModel>('Variable-Value', VariableValueSchema)
