import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, PipelineStage } from 'mongoose'
import {
  IEntityCommit,
  EntityCommitChangeType,
  EntityType,
  ICursor,
  DataWithCursor,
  EntityCommitStorageType,
  EntityCommitStatus,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'
import { IEntityDocument } from './entity.model'

const { Schema } = mongoose

export interface IEntityCommitDocument extends Omit<
IEntityCommit,
'_id' | 'projectBranch' | 'commit' | 'entity' | 'parentEntityCommit' | 'baseEntityCommit' | 'workspace' | 'project'
>, Document {
  _id: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId

  commit: ObjectId

  entity: ObjectId

  parentEntityCommit: ObjectId

  baseEntityCommit: ObjectId

  toObject(): IEntityCommitDocument
  toJSON(): IEntityCommit
}

export interface IEntityCommitWithEntityDocument {
  entity: IEntityDocument

  entityCommit: IEntityCommitDocument
}

export interface IConflictDocument {
  entity: IEntityDocument

  entityCommitFrom: IEntityCommitDocument

  entityCommitTo: IEntityCommitDocument

  baseEntityCommit: IEntityCommitDocument
}

export interface IEntityCommitModel extends Model<IEntityCommitDocument> {
  createEntityCommit(payload: Partial<IEntityCommit | IEntityCommitDocument>): Promise<IEntityCommitDocument>

  createEntityCommits(payload: Array<object>): Promise<Array<IEntityCommitDocument>>

  findEntityCommitById(id: string | ObjectId): Promise<IEntityCommitDocument | undefined>

  findEntityCommitByIds(ids: Array<string | ObjectId>): Promise<Array<IEntityCommitDocument>>

  findEntityCommitByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IEntityCommitDocument | undefined>

  findEntityCommits(
    filter: {
      entity?: string | ObjectId,
      entityType?: EntityType,
      projectBranch: string | ObjectId
      commit?: string | ObjectId
      committedOnly: boolean
      namedOnly: boolean
      name?: string
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<IEntityCommitDocument>>

  getChangesInBranch(
    projectBranchId: string | ObjectId,
    filter?: {
      entity?: string | string[] | ObjectId[] | ObjectId,
      changeType?: EntityCommitChangeType,
      entityType?: EntityType,
      afterCommit?: string | ObjectId,
    },
    cursor?: ICursor,
    sort?: ISortOptions
  ): Promise<DataWithCursor<IEntityCommitWithEntityDocument>>

  getChangesStatsInBranch(
    projectBranchId: string | ObjectId,
  ): Promise<Array<IEntityCommitDocument>>

  updateEntityCommitById(
    id: string | ObjectId,
    payload: Partial<IEntityCommitDocument>
  ): Promise<IEntityCommitDocument | undefined>

  updateEntityCommitByIds(
    ids: Array<string | ObjectId>,
    payload: object
  ): Promise<Array<IEntityCommitDocument>>

  getConflicts(
    projectBranchFromId: string | ObjectId,
    projectBranchToId: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<Array<IConflictDocument>>

  deleteEntityCommitById(id: string | ObjectId): Promise<void>

  deleteEntityCommitByIds(ids: Array<string | ObjectId>): Promise<void>

  getEntityCommitsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): any

  getEntityCommitsCursor(filter: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    storageType?: EntityCommitStorageType,
    status?: EntityCommitStatus
  }): any

  deleteEntityCommits(filter: {
    workspaceId: string | ObjectId,
    projectId: string| ObjectId,
    projectBranchId: string| ObjectId,
    entityId: string| ObjectId,
  }): Promise<void>

  deleteEntityCommitsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteEntityCommitsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  deleteEntityCommitsByProjectBranch(
    projectBranchId: string | ObjectId,
  ): Promise<void>
}

const EntityCommitSchema = new Schema({
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
  commit: {
    type: ObjectId,
    ref: 'Commit',
  },
  linkedToCommit: {
    type: Boolean,
  },
  parentEntityCommit: {
    type: ObjectId,
    ref: 'Entity-Commit',
  },
  changeType: {
    type: String,
    enum: Object.values(EntityCommitChangeType),
    required: true,
  },
  entity: {
    type: ObjectId,
    ref: 'Entity',
    required: true,
  },
  baseEntityCommit: {
    type: ObjectId,
    ref: 'Entity-Commit',
  },
  entityType: {
    type: String,
    enum: Object.values(EntityType),
    required: true,
  },
  storageType: {
    type: String,
    enum: Object.values(EntityCommitStorageType),
  },
  status: {
    type: String,
    enum: Object.values(EntityCommitStatus),
    required: true,
  },
  bucket: {
    type: String,
  },
  key: {
    type: String,
  },
  meta: {
    entityName: {
      type: String,
    },
    links: [{
      type: ObjectId,
      ref: 'Entity',
      required: true,
    }],
    summary: {
      type: Schema.Types.Map,
      of: String,
    },
  },
  name: {
    type: String,
  },
}, {
  timestamps: true,
})

EntityCommitSchema.statics.createEntityCommit = function (payload: Partial<IEntityCommit | IEntityCommitDocument>) {
  if (payload.commit) {
    payload.linkedToCommit = true
  }

  return new this(payload).save()
}

EntityCommitSchema.statics.createEntityCommits = function (payloads: Array<Partial<IEntityCommit | IEntityCommitDocument>>) {
  payloads.forEach(payload => {
    if (payload.commit) {
      payload.linkedToCommit = true
    }
  })

  return this.insertMany(payloads)
}

EntityCommitSchema.statics.findEntityCommitById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

EntityCommitSchema.statics.findEntityCommitByIds = function (ids: Array<string | ObjectId>) {
  return this.find({ _id: { $in: ids } })
}

EntityCommitSchema.statics.findEntityCommitByIdAndProjectAndWorkspace = function (
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

EntityCommitSchema.statics.findEntityCommits = async function (
  filter: {
    entity?: string,
    entityType?: EntityType,
    projectBranch: string
    commit?: string,
    committedOnly: boolean
    namedOnly: boolean
    name?: string
  },
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {
    projectBranch: new ObjectId(filter.projectBranch),
  }

  if (filter.entity) {
    conditions.entity = new ObjectId(filter.entity)
  }
  if (filter.commit) {
    conditions.commit = new ObjectId(filter.commit)
  } else if (filter.committedOnly) {
    conditions.commit = { $exists: true }
  }

  if (filter.namedOnly) {
    conditions.name = { $exists: true }
  }

  if (filter.name) {
    conditions.name = { $regex: filter.name, $options: 'i' }
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
      },
    },
    { $sort: { _id: -1 } },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          {
            $lookup: {
              from: 'commits',
              localField: 'commit',
              foreignField: '_id',
              as: 'commit',
            },
          },
          { $unwind: { path: '$commit', preserveNullAndEmptyArrays: false } },
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

EntityCommitSchema.statics.getChangesInBranch = async function (
  projectBranchId: string | ObjectId,
  filter?: {
    entity?: string | string[],
    changeType?: EntityCommitChangeType,
    entityType?: EntityType,
    afterCommit?: string | ObjectId,
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
): Promise<DataWithCursor<IEntityCommitWithEntityDocument>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['entityCommit._id'] = -1
  }

  const conditions: any = {
    projectBranch: new ObjectId(projectBranchId),
    linkedToCommit: true,
  }

  if (filter?.entity) {
    conditions.entity = Array.isArray(filter.entity)
      ? {
        $in: filter.entity.map(entityId => new ObjectId(entityId)),
      }
      : new ObjectId(filter.entity)
  }

  if (filter?.changeType) {
    conditions.changeType = filter.changeType
  }

  if (filter?.entityType) {
    conditions.entityType = filter.entityType
  }

  if (filter?.afterCommit) {
    conditions.commit = { $gte: new ObjectId(filter?.afterCommit) }
  }

  const pipeline: PipelineStage[] = [{
    $match: conditions,
  }, {
    $sort: {
      _id: -1,
    },
  }, {
    $group: {
      _id: '$entity',
      entityCommit: { $first: '$$ROOT' },
      entityCommitFirst: { $last: '$$ROOT' },
    },
  }, {
    $match: {
      $nor: [{
        'entityCommitFirst.changeType': 'CREATE',
        'entityCommit.changeType': 'DELETE',
      }],
    },
  }, {
    $sort: _sort,
  }, {
    $facet: {
      count: [{ $count: 'count' }],
      items: [
        ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
        ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
        {
          $lookup: {
            from: 'entities',
            localField: 'entityCommit.entity',
            foreignField: 'entityId',
            as: 'entity',
            pipeline: [{
              $match: {
                projectBranch: new ObjectId(projectBranchId),
              },
            }],
          },
        }, {
          $unwind: '$entity',
        },
      ],
    },
  }]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items.map((change) => {
      if (
        [EntityCommitChangeType.CREATE, EntityCommitChangeType.UPDATE].includes(change.entityCommit.changeType)
        && change.entityCommitFirst.changeType === EntityCommitChangeType.UPDATE
      ) {
        change.entity.typeOfChangeInBranch = EntityCommitChangeType.UPDATE
      }

      delete change.entityCommitFirst

      return change
    }),
    cursor: {
      total: count,
      skip: cursor?.skip || 0,
      limit: cursor?.limit || 0,
    },
  }
}

EntityCommitSchema.statics.getChangesStatsInBranch = async function (
  projectBranchId: string | ObjectId,
) {
  const pipeline: PipelineStage[] = [{
    $match: {
      projectBranch: new ObjectId(projectBranchId),
    },
  },
  {
    $group: {
      _id: {
        entity: '$entity',
      },
      firstEntityCommit: {
        $first: '$$ROOT',
      },
      lastEntityCommit: {
        $last: '$$ROOT',
      },
    },
  },
  {
    $project: {
      changeType: {
        $switch: {
          branches: [
            {
              case: {
                $eq: ['$firstEntityCommit._id', '$lastEntityCommit._id'],
              },
              then: '$lastEntityCommit.changeType',
            },
            {
              case: {
                $and: [
                  {
                    $eq: [
                      '$firstEntityCommit.changeType',
                      EntityCommitChangeType.CREATE,
                    ],
                  },
                  {
                    $eq: [
                      '$lastEntityCommit.changeType',
                      EntityCommitChangeType.DELETE,
                    ],
                  },
                ],
              },
              then: null,
            },
            {
              case: {
                $and: [
                  {
                    $eq: [
                      '$firstEntityCommit.changeType',
                      EntityCommitChangeType.CREATE,
                    ],
                  },
                  {
                    $eq: [
                      '$lastEntityCommit.changeType',
                      EntityCommitChangeType.UPDATE,
                    ],
                  },
                ],
              },
              then: EntityCommitChangeType.CREATE,
            },
          ],
          default: '$lastEntityCommit.changeType',
        },
      },
    },
  },
  {
    $match: {
      changeType: { $ne: null },
    },
  },
  {
    $group: {
      _id: {
        changeType: '$changeType',
      },
      count: {
        $count: {},
      },
    },
  },
  {
    $project: {
      _id: false,
      changeType: '$_id.changeType',
      count: '$count',
    },
  },
  ]

  const data = await this.aggregate(pipeline)

  return data
}

EntityCommitSchema.statics.updateEntityCommitById = function (
  id: string | ObjectId,
  payload: Partial<IEntityCommit>,
) {
  if (payload.commit) {
    payload.linkedToCommit = true
  }

  return this.findOneAndUpdate({
    _id: id,
  }, {
    $set: payload,
  }, {
    new: true,
    runValidators: true,
  })
}

EntityCommitSchema.statics.updateEntityCommitByIds = function (
  ids: Array<string | ObjectId>,
  payload: Partial<IEntityCommit>,
) {
  if (payload.commit) {
    payload.linkedToCommit = true
  }

  return this.updateMany({
    _id: { $in: ids },
  }, {
    $set: payload,
  }, {
    new: true,
    runValidators: true,
  })
}

EntityCommitSchema.statics.getConflicts = function (
  projectBranchFromId: string | ObjectId,
  projectBranchToId: string | ObjectId,
): Promise<Array<any>> {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        projectBranch: new ObjectId(projectBranchFromId),
        linkedToCommit: true,
      },
    },
    {
      $group: {
        _id: {
          entity: '$entity',
        },
        firstEntityCommitFrom: { $first: '$$ROOT' },
        entityCommitFrom: {
          $last: '$$ROOT',
        },
      },
    },
    {
      $match: {
        $nor: [{
          'firstEntityCommitFrom.changeType': 'CREATE',
          'entityCommitFrom.changeType': 'DELETE',

        }, {
          'entityCommitFrom.changeType': 'CREATE',
        },
        ],

      },
    },
    {
      $project: {
        _id: 0,
        firstEntityCommitFrom: 0,
      },
    },
    {
      $lookup: {
        from: 'entity-commits',
        localField: 'entityCommitFrom.baseEntityCommit',
        foreignField: '_id',
        as: 'baseEntityCommit',
        pipeline: [{
          $match: {
            projectBranch: new ObjectId(projectBranchToId),
          },
        }],
      },
    },
    {
      $unwind: '$baseEntityCommit',
    },
    {
      $lookup: {
        from: 'entity-commits',
        localField: 'entityCommitFrom.entity',
        foreignField: 'entity',
        as: 'entityCommitTo',
        pipeline: [{
          $match: {
            projectBranch: new ObjectId(projectBranchToId),
            linkedToCommit: true,
          },
        }, {
          $sort: { _id: -1 },
        }, {
          $limit: 1,
        }],
      },
    },
    {
      $unwind: '$entityCommitTo',
    },
    {
      $match: {
        $expr: {
          $ne: ['$entityCommitTo._id', '$baseEntityCommit._id'],
        },
      },
    },
    {
      $lookup: {
        from: 'entities',
        localField: 'entityCommitFrom.entity',
        foreignField: 'entityId',
        as: 'entity',
        pipeline: [{
          $match: {
            projectBranch: new ObjectId(projectBranchToId),
          },
        }, {
          $limit: 1,
        }],
      },
    },
    {
      $unwind: '$entity',
    },
  ]

  return this.aggregate(pipeline)
}

EntityCommitSchema.statics.deleteEntityCommitById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

EntityCommitSchema.statics.deleteEntityCommitByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

EntityCommitSchema.statics.getEntityCommitsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

EntityCommitSchema.statics.getEntityCommitsCursor = function (
  filter: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    status?: EntityCommitStatus,
    storageType?: EntityCommitStorageType,
  },
): any {
  return this.find(filter).sort({ _id: 1 }).cursor()
}

EntityCommitSchema.statics.deleteEntityCommitsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

EntityCommitSchema.statics.deleteEntityCommits = function(filter: {
  workspaceId: string | ObjectId,
  projectId?: string| ObjectId,
  projectBranchId?: string| ObjectId,
  entityId?: string| ObjectId,
}): Promise<void> {
  const conditions: Partial<IEntityCommitDocument> = {
    workspace: new ObjectId(filter.workspaceId),
  }
  if (filter.projectId) {
    conditions.project= new ObjectId(filter.projectId)
  }
  if (filter.projectBranchId) {
    conditions.projectBranch = new ObjectId(filter.projectBranchId)
  }
  if (filter.entityId) {
    conditions.entity = new ObjectId(filter.entityId)
  }

  return this.deleteMany(conditions)
}
EntityCommitSchema.statics.deleteEntityCommitsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

EntityCommitSchema.statics.deleteEntityCommitsByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

EntityCommitSchema.index(
  {
    workspace: 1,
    project: 1,
  },
)

EntityCommitSchema.index(
  {
    entity: 1,
    projectBranch: 1,
  },
)

EntityCommitSchema.index(
  {
    _id: -1,
    projectBranch: -1,
    entity: 1,
    linkedToCommit: 1,
  },
)

EntityCommitSchema.index(
  {
    projectBranch: 1,
  },
)

export const EntityCommitModel = mongoose.model<IEntityCommitDocument, IEntityCommitModel>('Entity-Commit', EntityCommitSchema)
