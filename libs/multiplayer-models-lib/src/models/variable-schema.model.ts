import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, PipelineStage } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IVariableSchema,
  ICursor,
  DataWithCursor,
  // SystemTag,
  VariableSchemaType,
  VariableSchemaEntityType,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IVariableSchemaDocument extends Omit<IVariableSchema, '_id' | 'variableSchemaId' | 'workspace' | 'project' | 'projectBranch' | 'createdAtCommit' | 'archivedAtCommit' | 'deletedAtCommit'>, Document {
  _id: ObjectId

  variableSchemaId: ObjectId | string

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId | string

  createdAtCommit: ObjectId | string

  archivedAtCommit: ObjectId | string

  deletedAtCommit: ObjectId | string

  toObject(): IVariableSchemaDocument
  toJSON(): IVariableSchema
}

export interface IVariableSchemaModel extends Model<IVariableSchemaDocument> {
  createVariableSchema(payload: object): Promise<IVariableSchemaDocument>

  getVariableSchemaById(
    variableSchemaId: string | ObjectId,
    projectBranchId: string | ObjectId | string[] | ObjectId[],
  ): Promise<IVariableSchemaDocument | undefined>

  findVariableSchemas(
    filter: object,
    cursor?: ICursor
  ): Promise<DataWithCursor<IVariableSchemaDocument>>

  findVariableSchemaByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IVariableSchemaDocument | undefined>

  getVariableSchemasState(
    projectBranchTreeIds: string[] | ObjectId[],
    filter?: Partial<IVariableSchema> & {
      archived?: boolean
      withDeleted?: boolean
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IVariableSchemaDocument>>

  updateVariableSchemaById(
    variableSchemaId: string | ObjectId,
    projectBranchId: string | ObjectId,
    payload: object
  ): Promise<IVariableSchemaDocument | undefined>

  deleteVariableSchema(
    id: string | ObjectId,
    projectBranchId: string | ObjectId,
  ): Promise<void>

  getVariableSchemasInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): any

  deleteVariableSchemasByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteVariableSchemasByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deleteVariablesByProjectBranch(
    projectBranchId: string | ObjectId
  ): Promise<void>
}

const VariableSchemaSchema = new Schema({
  variableSchemaId: {
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
  entityType: {
    type: String,
    enum: Object.values(VariableSchemaEntityType),
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(VariableSchemaType),
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  defaultValue: {
    type: String,
  },
  required: {
    type: Boolean,
  },
  // tags: [{
  //   type: ObjectId,
  //   ref: 'Tag',
  // }],
  // systemTags: [{
  //   type: String,
  //   enum: Object.values(SystemTag),
  // }],

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

VariableSchemaSchema.statics.createVariableSchema = function (
  payload: object,
) {
  return new this(payload).save()
}

VariableSchemaSchema.statics.getVariableSchemaById = async function (
  variableSchemaId: string | ObjectId,
  projectBranchId: string | ObjectId | string[] | ObjectId[],
) {
  const [entity] = await this.find({
    variableSchemaId: new ObjectId(variableSchemaId),
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }).sort({
    _id: -1,
  }).limit(1)

  return entity
}

VariableSchemaSchema.statics.findVariableSchemas = async function (
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

VariableSchemaSchema.statics.updateVariableSchemaById = function (
  variableSchemaId: string | ObjectId,
  projectBranchId: string | ObjectId,
  payload: object,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)
  return this.findOneAndUpdate(
    {
      variableSchemaId,
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

VariableSchemaSchema.statics.findVariableSchemaByIdAndProjectAndWorkspace = function(
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

VariableSchemaSchema.statics.getVariableSchemasState = async function(
  projectBranchTreeIds: string[] | ObjectId[],
  filter?: Partial<IVariableSchema> & {
    archived?: boolean
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
): Promise<DataWithCursor<IVariableSchema>> {
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

  if (filter?.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...conditions,
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
          {
            $lookup: {
              from: 'variable-values',
              localField: 'variableSchemaId',
              foreignField: 'variableSchema',
              as: 'variableValues',
              pipeline: [{
                $match: {
                  projectBranch: {
                    $in: projectBranchTreeIds.map(projectBranchId => new ObjectId(projectBranchId)),
                  },
                },
              }, {
                $group: {
                  _id: '$variableValueId',
                  variableValue: {
                    $last: '$$ROOT',
                  },
                },
              }, {
                $replaceRoot: {
                  newRoot: '$variableValue',
                },
              }],
            },
          },
          {
            $unwind: {
              path: '$variableValue',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
  ]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
      ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
    },
  }
}

VariableSchemaSchema.statics.deleteVariableSchema = function (
  entityId: string | ObjectId,
  projectBranchId: string | ObjectId,
) {
  return this.deleteOne({
    entityId,
    projectBranch: projectBranchId,
  })
}

VariableSchemaSchema.statics.getVariableSchemasInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

VariableSchemaSchema.statics.deleteVariableSchemasByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

VariableSchemaSchema.statics.deleteVariableSchemasByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

VariableSchemaSchema.statics.deleteVariablesByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

VariableSchemaSchema.index(
  { project: 1, projectBranch: 1, variableSchemaId: 1 },
  { unique: true },
)

VariableSchemaSchema.index(
  { projectBranch: 1, variableSchemaId: 1 },
  { unique: true },
)

VariableSchemaSchema.index(
  { projectBranch: 1, variableSchemaId: 1, entity: 1 },
  { unique: true },
)

export const VariableSchemaModel = mongoose.model<IVariableSchema, IVariableSchemaModel>('Variable-Schema', VariableSchemaSchema)
