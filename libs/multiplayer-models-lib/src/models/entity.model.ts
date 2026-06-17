import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, PipelineStage } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IEntity,
  EntityType,
  EntityCommitChangeType,
  ICursor,
  DataWithCursor,
  EntityCommitStorageType,
  AliasConflict,
  ITag,
  IAccess,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { IEntityCommitDocument } from './entity-commit.model'
// import { SKIP, LIMIT } from '../config'
import { GitRefSchema } from './shared/git-ref.model'
import { TagSchema } from './shared/tag.model'
import { AccessSchema } from './shared/access.model'
import { LIMIT, SKIP } from '../config'

const { Schema } = mongoose

export const EntityTypesWithUniqueAlias = [
  EntityType.PLATFORM,
  EntityType.PLATFORM_COMPONENT,
  EntityType.ENVIRONMENT,
  EntityType.NOTEBOOK,
  EntityType.EXCALIDRAW,
  EntityType.VARIABLE_GROUP,
]

export interface IPopulatedEntityStateDocument {
  entity: IEntityDocument
  entityCommit: IEntityCommitDocument
}

export interface IEntityDocument extends Omit<IEntity, '_id' | 'entityId' | 'projectBranch' | 'project' | 'workspace' | 'createdAtCommit' | 'latestEntityCommit' | 'deletedAtCommit'>, Document {
  _id: ObjectId

  entityId: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId

  latestEntityCommit: ObjectId

  createdAtCommit: ObjectId | string

  deletedAtCommit?: ObjectId | string | null

  toObject(): IEntity
  toJSON(): IEntity
}

export interface IDocumentModel extends Model<IEntityDocument> {
  createEntity(
    payload: object
  ): Promise<IEntityDocument>

  findEntityInProjectAndWorkspace(
    entityId: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IEntityDocument | undefined>

  getEntityInBranchByEntityId(
    entityId: string | ObjectId,
    projectBranchId: string | ObjectId | string[] | ObjectId[],
    filter?: {
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      type?: EntityType,
      deleted?: boolean
    }
  ): Promise<IEntityDocument | undefined>

  getEntitiesInBranchByEntityIds(
    entityIds: string[] | ObjectId[],
    projectBranchId: string | ObjectId | string[] | ObjectId[],
    filter?: {
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      type?: EntityType,
      deleted?: boolean
    }
  ): Promise<IEntityDocument[]>

  getEntitiesInBranchByKeys(
    keys: string[],
    projectBranchId: string | ObjectId | string[] | ObjectId[],
    filter?: {
      type?: EntityType,
      workspace: string | ObjectId,
      project: string | ObjectId,
    }
  ): Promise<IEntityDocument[]>

  getEntityInBranchByKey(
    key: string,
    projectBranchId: string | ObjectId | string[] | ObjectId[],
    filter: {
      type?: EntityType,
      workspace: string | ObjectId,
      project: string | ObjectId,
    },
  ): Promise<IEntityDocument>

  findEntities(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      projectBranch: string | ObjectId | string[] | ObjectId[],
      entityId?: string | string[] | ObjectId[] | ObjectId,
      key?: string,
      text?: string,
      archived?: boolean
      type?: EntityType,
      typeOfChangeInBranch?: EntityCommitChangeType
      deletedAtCommit?: string | ObjectId,
      tags?: ITag[],
      shared?: boolean,
      sharedWithWorkspaceUser?: string | ObjectId | string[] | ObjectId[],
      default?: boolean
    },
    cursor?: ICursor,
    sort?: ISortOptions
  ): Promise<DataWithCursor<IEntityDocument>>

  updateEntityInBranch(
    entityId: string | ObjectId | string[] | ObjectId[],
    projectBranchId: string | ObjectId,
    payload: Partial<IEntityDocument>,
  ): Promise<IEntityDocument | undefined>

  deleteEntityInBranch(
    id: string | ObjectId,
    projectBranchId: string | ObjectId,
  ): Promise<void>

  getProjectBranchState(
    projectBranchIds: string[] | ObjectId[],
    filter?: {
      commitId?: string,
      archived?: boolean,
      type?: EntityType,
      key?: string | string[],
      entityId?: string | string[] | ObjectId[] | ObjectId,
      showDeleted?: boolean,
      hasUncommittedSource?: boolean,
      text?: string,
      tags?: ITag[],
      default?: boolean
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions
  ): Promise<DataWithCursor<IPopulatedEntityStateDocument>>

  getEntitiesInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: any,
  ): any

  deleteEntitiesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteEntitiesByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  keyAliasesExist(params: {
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    projectBranchId: string | ObjectId,
    entityId: string | ObjectId,
    keyAliases: string[]
  }): Promise<IEntity>

  getConflicts(
    projectBranchFromId: string | ObjectId,
    projectBranchToId: string | ObjectId,
  ): Promise<Array<AliasConflict>>

  countEntitiesInBranch(filter: {
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    projectBranchId: string | ObjectId,
    type: EntityType,
    default?: boolean
  }): Promise<number>

  getEntityAliases(filter: {
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    projectBranchId: string | ObjectId,
    type?: EntityType | EntityType[],
  }): Promise<{
    entityId: ObjectId,
    key: string[],
    keyAliases: string[]
  }[]>

  getUniqueTags(
    filter: {
      workspaceId: string | ObjectId,
      projectId: string | ObjectId,
    }
  ): Promise<string[]>

  deleteEntitiesByProjectBranch(
    projectBranchId: string | ObjectId,
  ): Promise<void>

  removeAliasFromEntityInBranch(
    entityId: string | ObjectId,
    projectBranchId: string | ObjectId,
    keyAlias: string
  ): Promise<IEntityDocument | undefined>

  getAllEntities(filter: {
    workspaceId?: string,
    types?: EntityType[],
  }, cursor?: ICursor): Promise<DataWithCursor<IEntityDocument>>

  updateEntityAccess(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    entityId: string | ObjectId,
    payload: Partial<IAccess>,
  ): Promise<IAccess | undefined>

  getSharedEntities(
    filter: {
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      key?: string,
      text?: string,
      type?: EntityType,
      tags?: ITag[],
      archived?: boolean,
      sharedWithWorkspaceUser?: string | ObjectId | string[] | ObjectId[],
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IEntityDocument>>

  findEntityByPublicShareToken(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    publicShareToken: string,
  ): Promise<IEntityDocument>
}

const EntitySchema = new Schema({
  entityId: {
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
  default: {
    type: Boolean,
  },
  projectBranch: {
    type: ObjectId,
    ref: 'Project-Branch',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(EntityType),
    required: true,
  },
  keyAliases: [{
    type: String,
  }],
  hostnames: [{
    type: String,
  }],
  gitRef: GitRefSchema,
  key: {
    type: String,
    required: true,
  },
  sourceUri: {
    type: String,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  tags: [TagSchema],
  metadata: {
    type: Schema.Types.Map,
    of: String,
  },
  typeOfChangeInBranch: {
    type: String,
    enum: Object.values(EntityCommitChangeType),
    required: true,
  },
  latestEntityCommit: {
    type: ObjectId,
    ref: 'Entity-Commit',
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
  access: AccessSchema,
}, {
  timestamps: true,
})

EntitySchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    delete ret._id
    delete ret.__v
    return ret
  },
})
EntitySchema.set('toObject', {
  transform: function (doc, ret, opt) {
    delete ret._id
    delete ret.__v
    return ret
  },
})

EntitySchema.statics.createEntity = function (payload: object) {
  return new this(payload).save()
}

EntitySchema.statics.findEntityInProjectAndWorkspace = function (
  entityId: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
): Promise<IEntityDocument | undefined> {
  return this.findOne({
    entityId,
    workspace: workspaceId,
    project: projectId,
  })
}

EntitySchema.statics.getEntityInBranchByEntityId = async function (
  entityId: string | ObjectId,
  projectBranchId: string | ObjectId | string[] | ObjectId[],
  filter: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    type?: EntityType,
    deleted?: boolean
  } = {},
) {
  const conditions: any = {
    entityId: new ObjectId(entityId),
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }

  if (!('deleted' in (filter || {})) || !filter.deleted) {
    conditions.typeOfChangeInBranch = {
      $ne: EntityCommitChangeType.DELETE,
    }
    conditions.deletedAtCommit = {
      $exists: false,
    }
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  const [entity] = await this.find(conditions).sort({
    _id: -1,
  }).limit(1)

  return entity
}

EntitySchema.statics.getEntitiesInBranchByEntityIds = async function (
  entityIds: string[] | ObjectId[],
  projectBranchId: string | ObjectId | string[] | ObjectId[],
  filter?: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    type?: EntityType,
    deleted?: boolean
  },
) {
  const conditions: {
    entityId: { $in: ObjectId[] },
    projectBranch: ObjectId | { $in: ObjectId[] }
    type?: EntityType,
    typeOfChangeInBranch?: any,
    deletedAtCommit?: any
  } = {
    entityId: {
      $in: entityIds.map(entityId => new ObjectId(entityId)),
    },
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  if (!('deleted' in (filter || {})) || !filter?.deleted) {
    conditions.typeOfChangeInBranch = {
      $ne: EntityCommitChangeType.DELETE,
    }
    conditions.deletedAtCommit = {
      $exists: false,
    }
  }

  const pipeline = [{
    $match: conditions,
  }, {
    $group: {
      _id: '$entityId',
      entity: {
        $last: '$$ROOT',
      },
    },
  }, {
    $unwind: {
      path: '$entity',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $replaceRoot: { newRoot: '$entity' },
  }]

  const entities = await this.aggregate(pipeline)

  return entities
}

EntitySchema.statics.getEntitiesInBranchByKeys = async function (
  keys: string[],
  projectBranchId: string | ObjectId | string[] | ObjectId[],
  filter: {
    type?: EntityType,
    workspace: string | ObjectId,
    project: string | ObjectId,
  },
) {
  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    typeOfChangeInBranch: { $ne: EntityCommitChangeType.DELETE },
    deletedAtCommit: {
      $exists: false,
    },
    $or: [{
      key: { $in: keys },
    }, {
      keyAliases: { $in: keys },
    }],
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  const pipeline = [{
    $match: conditions,
  }, {
    $group: {
      _id: '$entityId',
      entity: {
        $last: '$$ROOT',
      },
    },
  }, {
    $unwind: {
      path: '$entity',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $replaceRoot: { newRoot: '$entity' },
  }]

  const entities = await this.aggregate(pipeline)

  return entities
}

EntitySchema.statics.getEntityInBranchByKey = async function (
  key: string,
  projectBranchId: string | ObjectId | string[] | ObjectId[],
  filter: {
    type?: EntityType,
    workspace: string | ObjectId,
    project: string | ObjectId,
  },
) {
  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    typeOfChangeInBranch: {
      $ne: EntityCommitChangeType.DELETE,
    },
    deletedAtCommit: {
      $exists: false,
    },
    $or: [{
      key,
    }, {
      keyAliases: key,
    }],
    projectBranch: Array.isArray(projectBranchId)
      ? { $in: projectBranchId.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(projectBranchId),
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  const pipeline = [{
    $match: conditions,
  }, {
    $group: {
      _id: '$entityId',
      entity: {
        $last: '$$ROOT',
      },
    },
  }, {
    $unwind: {
      path: '$entity',
      preserveNullAndEmptyArrays: false,
    },
  }, {
    $replaceRoot: { newRoot: '$entity' },
  }]

  const [entity] = await this.aggregate(pipeline)

  return entity
}

EntitySchema.statics.findEntities = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    projectBranch: string | ObjectId | string[] | ObjectId[],
    entityId?: string | string[] | ObjectId[] | ObjectId,
    key?: string,
    text?: string,
    archived?: boolean,
    type?: EntityType,
    typeOfChangeInBranch?: EntityCommitChangeType
    deletedAtCommit?: string | ObjectId,
    tags?: ITag[],
    shared?: boolean,
    sharedWithWorkspaceUser?: string | ObjectId | string[] | ObjectId[],
    default?: boolean
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

  if (cursor?.skip && cursor?.limit) {
    _cursor = cursor
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
    projectBranch: Array.isArray(filter.projectBranch)
      ? { $in: filter.projectBranch.map(_projectBranchId => new ObjectId(_projectBranchId)) }
      : new ObjectId(filter.projectBranch),
  }

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  if (filter.key) {
    conditions.$or = [{
      key: filter.key,
    }, {
      keyAliases: filter.key,
    }]
  }

  if (filter.type) {
    conditions.type = filter.type
  }

  if (
    !filter.typeOfChangeInBranch
    && !filter.deletedAtCommit
  ) {
    conditions.typeOfChangeInBranch = {
      $ne: EntityCommitChangeType.DELETE,
    }
    conditions.deletedAtCommit = { $exists: false }
  }

  if (filter?.entityId) {
    conditions.entityId = Array.isArray(filter.entityId)
      ? { $in: filter.entityId.map(_entityId => new ObjectId(_entityId)) }
      : new ObjectId(filter.entityId)
  }

  if (filter?.text) {
    // conditions.$text = {
    //   $search: filter?.text,
    // }
    conditions.$or = [{
      keyAliases: {
        $elemMatch: {
          $regex: filter?.text,
          $options: 'i',
        },
      },
    }, {
      key: {
        $regex: filter?.text,
        $options: 'i',
      },
    }]
  }

  if (filter.tags?.length) {
    conditions.tags = {
      $all: filter.tags.map(tag => ({
        $elemMatch: {
          ...tag.key ? { key: tag.key } : {},
          value: tag.value,
        },
      })),
    }
  }

  if (filter.shared) {
    conditions.$and = [
      ...(conditions.$and || []),
      {
        $or: [{
          'access.workspaceUsers.0.workspaceUser': {
            $exists: true,
          },
        }, {
          'access.workspaces.0.workspace': {
            $exists: true,
          },
        }, {
          'access.projects.0.project': {
            $exists: true,
          },
        }, {
          'access.teams.0.team': {
            $exists: true,
          },
        }, {
          'access.publicLink.url': {
            $exists: true,
          },
        }],
      },
    ]
  }

  if (filter.sharedWithWorkspaceUser) {
    if (Array.isArray(filter.sharedWithWorkspaceUser)) {
      conditions['access.workspaceUsers.workspaceUser'] = {
        $in: filter.sharedWithWorkspaceUser.map(workspaceUserId => new ObjectId(workspaceUserId)),
      }
    } else {
      conditions['access.workspaceUsers.workspaceUser'] = new ObjectId(filter.sharedWithWorkspaceUser)
    }
  }

  if (typeof filter.default === 'boolean') {
    conditions.default = filter.default || { $ne: true }
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
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
          { $project: { _id: 0 } },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      ..._cursor.skip && _cursor.limit
        ? {
          skip: _cursor.skip,
          limit: _cursor.limit,
        }
        : {},
    },
  }
}

EntitySchema.statics.updateEntityInBranch = function (
  entityId: string | ObjectId | string[] | ObjectId[],
  projectBranchId: string | ObjectId,
  payload: Partial<IEntityDocument>,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  const filter: {
    entityId?: ObjectId | { $in: ObjectId[] },
    projectBranch: ObjectId
  } = {
    projectBranch: new ObjectId(projectBranchId),
  }

  if (Array.isArray(entityId)) {
    filter.entityId = { $in: entityId.map(_entityId => new ObjectId(_entityId)) }
  } else {
    filter.entityId = new ObjectId(entityId)
  }


  return this.findOneAndUpdate(
    filter,
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

EntitySchema.statics.deleteEntityInBranch = function (
  entityId: string | ObjectId,
  projectBranchId: string | ObjectId,
) {
  return this.deleteOne({
    entityId,
    projectBranch: projectBranchId,
  })
}

EntitySchema.statics.getProjectBranchState = async function (
  projectBranchIds: string[] | ObjectId[],
  filter?: {
    commitId?: string,
    archived?: boolean,
    type?: EntityType,
    key?: string | string[],
    showDeleted?: boolean,
    entityId?: string | string[],
    hasUncommittedSource?: boolean,
    text?: string,
    tags?: ITag[],
    default?: boolean
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
) {
  const _sort: any = {}

  if (sort?.sortKey) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['entityCommit._id'] = -1
  }

  const conditions: any = {
    projectBranch: {
      $in: projectBranchIds.map(projectBranchId => new ObjectId(projectBranchId)),
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

  if (filter?.type) {
    conditions.type = filter?.type
  }

  if ('default' in (filter || {})) {
    conditions.default = filter?.default
  }

  if (filter?.key) {
    const _keyFilter = Array.isArray(filter.key)
      ? { $in: filter.key }
      : filter.key
    conditions.$or = [{
      key: _keyFilter,
    }, {
      keyAliases: _keyFilter,
    }]
  }

  if (filter?.entityId) {
    conditions.entityId = Array.isArray(filter.entityId)
      ? { $in: filter.entityId.map(_entityId => new ObjectId(_entityId)) }
      : new ObjectId(filter.entityId)
  }

  const filterAfterGroup: PipelineStage[] = []
  if (!filter?.showDeleted) {
    filterAfterGroup.push({
      $match: { 'entity.deletedAtCommit': { $exists: false } },
    })
  }

  const entityCommitFilter: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = []
  if (filter?.hasUncommittedSource) {
    conditions['gitRef.repositoryId'] = { $exists: true }
    entityCommitFilter.push({ $match: { storageType: EntityCommitStorageType.S3 } })
  }

  if (filter?.text) {
    // conditions.$text = {
    //   $search: filter?.text,
    // }
    conditions.$or = [{
      keyAliases: {
        $elemMatch: {
          $regex: filter?.text,
          $options: 'i',
        },
      },
    }, {
      key: {
        $regex: filter?.text,
        $options: 'i',
      },
    }]
  }

  if (filter?.tags?.length) {
    conditions.tags = {
      $all: filter.tags.map(tag => ({
        $elemMatch: {
          ...tag.key ? { key: tag.key } : {},
          value: tag.value,
        },
      })),
    }
  }

  let entityCommitsLookupStage = {
    from: 'entity-commits',
    as: 'entityCommit',
    localField: 'entity.latestEntityCommit',
    foreignField: '_id',
    pipeline: [
      ...entityCommitFilter,
    ],
  }
  if (mergeCommitId) {
    entityCommitsLookupStage = {
      from: 'entity-commits',
      as: 'entityCommit',
      localField: 'entity.entityId',
      foreignField: 'entity',
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $or: projectBranchIds.map((projectBranchId, index) => ({
                    $and: [
                      { $eq: ['$projectBranch', new ObjectId(projectBranchId)] },
                      ...index > 0 && mergeCommitId
                        ? [{ $lt: ['$commit', new ObjectId(mergeCommitId)] }]
                        : [],
                    ],
                  })),
                },
                { $eq: ['$linkedToCommit', true] },
              ],
            },
          },
        },
        {
          $sort: {
            _id: -1,
            projectBranch: -1,
          },
        },
        {
          $limit: 1,
        },
        ...entityCommitFilter,
      ],
    }
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...conditions,
      },
    },
    {
      $group: {
        _id: '$entityId',
        entity: {
          '$top': {
            sortBy: {
              'projectBranch': -1,
            },
            output: '$$ROOT',
          },
        },
      },
    },
    ...filterAfterGroup,
    {
      $lookup: entityCommitsLookupStage,
    },
    {
      $unwind: {
        path: '$entityCommit',
        preserveNullAndEmptyArrays: false,
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
            $project: {
              _id: 0,
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
      skip: cursor?.skip,
      limit: cursor?.limit,
    },
  }
}

EntitySchema.statics.getEntitiesInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IEntityDocument>,
): Promise<IEntityDocument[]> {
  const conditions: any = {
    workspace: workspaceId,
    project: projectId,
    ...filter,
  }

  return this.find(conditions).sort({ _id: 1 }).cursor()
}

EntitySchema.statics.deleteEntitiesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

EntitySchema.statics.deleteEntitiesByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

EntitySchema.statics.keyAliasesExist = function (params: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  projectBranchId: string | ObjectId,
  entityId: string | ObjectId,
  keyAliases: string[]
}) {
  return this.findOne({
    workspace: params.workspaceId,
    project: params.projectId,
    projectBranch: params.projectBranchId,
    entityId: { $ne: params.entityId },
    keyAliases: { $in: params.keyAliases },
  })
}

EntitySchema.statics.getConflicts = function (
  projectBranchFromId: string | ObjectId,
  projectBranchToId: string | ObjectId,
): Promise<Array<AliasConflict>> {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        type: { $in: EntityTypesWithUniqueAlias },
        projectBranch: {
          $in: [
            new ObjectId(projectBranchFromId),
            new ObjectId(projectBranchToId),
          ],
        },
      },
    },
    {
      $group: {
        _id: '$entityId',
        entity: {
          $last: '$$ROOT',
        },
      },
    },
    {
      $match: {
        'entity.deletedAtCommit': { $exists: false },
        'entity.latestEntityCommit': { $ne: null },
      },
    },
    {
      $project: {
        keyAlias: { $concatArrays: ['$entity.keyAliases', ['$entity.key']] },
        entityFrom: '$entity',
      },
    },
    {
      $unwind: {
        path: '$keyAlias',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: { keyAlias: '$keyAlias', type: '$entityFrom.type' },
        count: { $sum: 1 },
        duplicates: { $addToSet: '$entityFrom' },
      },
    }, {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        alias: '$_id.keyAlias',
        duplicates: 1,
      },
    },
  ]

  return this.aggregate(pipeline)
}

EntitySchema.statics.countEntitiesInBranch = function (filter: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  projectBranchId: string | ObjectId,
  type: EntityType,
  default?: boolean
}): Promise<number> {
  const conditions: any = {
    workspace: filter.workspaceId,
    project: filter.projectId,
    projectBranch: filter.projectBranchId,
    type: filter.type,
    deletedAtCommit: { $exists: false },
    typeOfChangeInBranch: {
      $ne: EntityCommitChangeType.DELETE,
    },
  }

  if (typeof filter.default === 'boolean') {
    conditions.default = filter.default || { $ne: true }
  }

  return this.countDocuments(conditions)
}

EntitySchema.statics.getEntityAliases = function (filter: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  projectBranchId: string | ObjectId,
  type?: EntityType | EntityType[],
}): Promise<{
    entityId: ObjectId,
    key: string[],
    keyAliases: string[]
  }[]> {
  const conditions: any = {
    workspace: filter.workspaceId,
    project: filter.projectId,
    projectBranch: filter.projectBranchId,
    deletedAtCommit: { $exists: false },
  }

  if (filter.type) {
    conditions.type = Array.isArray(filter.type)
      ? { $in: filter.type }
      : filter.type
  }

  return this.find(
    conditions,
    {
      _id: 0,
      entityId: 1,
      type: 1,
      key: 1,
      keyAliases: 1,
    },
  )
}

EntitySchema.statics.getUniqueTags = async function (filter: {
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
}): Promise<string[]> {
  const pipeline = [
    {
      $match: {
        workspace: new ObjectId(filter.workspaceId),
        project: new ObjectId(filter.projectId),
      },
    },
    { $unwind: '$tags' },
    { $group: { _id: null, tags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, tags: 1 } },
  ]

  const [{ tags } = { tags: [] }] = await this.aggregate(pipeline)

  return tags
}

EntitySchema.statics.deleteEntitiesByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}
EntitySchema.statics.getAllEntities = async function (filter: {
  workspaceId?: string,
  types?: EntityType[],
}, cursor: ICursor = {}): Promise<DataWithCursor<IEntityDocument>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const condition: Record<string, any> = {
    deletedAtCommit: { $exists: false },
  }
  if (filter.workspaceId) {
    condition.workspace = new ObjectId(filter.workspaceId)
  }
  if (filter.types) {
    condition.type = { $in: filter.types }
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: condition,
    }, {
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

EntitySchema.statics.removeAliasFromEntityInBranch = function (
  entityId: string | ObjectId,
  projectBranchId: string | ObjectId,
  keyAlias: string,
): Promise<IEntityDocument | undefined> {
  const filter = {
    entityId,
    projectBranch: projectBranchId,
  }
  const update = {
    $pull: {
      keyAliases: keyAlias,
    },
  }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

EntitySchema.statics.updateEntityAccess = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  entityId: string | ObjectId,
  payload: Partial<IAccess>,
): Promise<IAccess | undefined> {
  const _payload = MongoPayload.prependToKeys(payload, 'access')
  const { set, unset } = MongoPayload.prepareUpdateParams(_payload)

  const filter = {
    workspace: workspaceId,
    project: projectId,
    entityId,
  }
  const update = {
    $set: set,
    $unset: unset,
  }
  const options = { new: true, runValidators: true }

  return this.updateMany(filter, update, options)
}

EntitySchema.statics.getSharedEntities = async function (
  filter: {
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    key?: string,
    text?: string,
    type?: EntityType,
    tags?: ITag[],
    archived?: boolean,
    sharedWithWorkspaceUser?: string | ObjectId | string[] | ObjectId[],
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

  if (cursor?.skip && cursor?.limit) {
    _cursor = cursor
  }

  const conditions: any = {
    typeOfChangeInBranch: {
      $ne: EntityCommitChangeType.DELETE,
    },
    deletedAtCommit: {
      $exists: false,
    },
  }

  if (filter.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  if (filter.key) {
    conditions.$or = [{
      key: filter.key,
    }, {
      keyAliases: filter.key,
    }]
  }

  if (filter.type) {
    conditions.type = filter.type
  }

  if (filter?.text) {
    // conditions.$text = {
    //   $search: filter?.text,
    // }
    conditions.$or = [{
      keyAliases: {
        $elemMatch: {
          $regex: filter?.text,
          $options: 'i',
        },
      },
    }, {
      key: {
        $regex: filter?.text,
        $options: 'i',
      },
    }]
  }

  if (filter.tags?.length) {
    conditions.tags = {
      $all: filter.tags.map(tag => ({
        $elemMatch: {
          ...tag.key ? { key: tag.key } : {},
          value: tag.value,
        },
      })),
    }
  }

  if (filter.sharedWithWorkspaceUser) {
    if (Array.isArray(filter.sharedWithWorkspaceUser)) {
      conditions['access.workspaceUsers.workspaceUser'] = {
        $in: filter.sharedWithWorkspaceUser.map(workspaceUserId => new ObjectId(workspaceUserId)),
      }
    } else {
      conditions['access.workspaceUsers.workspaceUser'] = new ObjectId(filter.sharedWithWorkspaceUser)
    }
  } else {
    conditions.$or = [
      ...(conditions.$or || []),
      {
        'access.workspaceUsers.0.workspaceUser': {
          $exists: true,
        },
      }, {
        'access.workspaces.0.workspace': {
          $exists: true,
        },
      }, {
        'access.projects.0.project': {
          $exists: true,
        },
      }, {
        'access.teams.0.team': {
          $exists: true,
        },
      }, {
        'access.publicLink.url': {
          $exists: true,
        },
      },
    ]
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...conditions,
      },
    }, {
      $project: {
        access: 0,
      },
    }, {
      $group: {
        _id: '$entityId',
        entity: {
          $last: '$$ROOT',
        },
      },
    }, {
      $unwind: {
        path: '$entity',
        preserveNullAndEmptyArrays: false,
      },
    }, {
      $replaceRoot: { newRoot: '$entity' },
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
          { $project: { _id: 0 } },
        ],
      },
    },
  ]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      ..._cursor.skip && _cursor.limit
        ? {
          skip: _cursor.skip,
          limit: _cursor.limit,
        }
        : {},
    },
  }
}

EntitySchema.statics.findEntityByPublicShareToken = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  publicShareToken: string,
): Promise<IEntityDocument | undefined> {
  const filter = {
    workspace: workspaceId,
    project: projectId,
    'access.publicLink.token': publicShareToken,
  }

  return this.findOne(filter)
}

EntitySchema.index({
  'access.publicLink.token': 1,
}, {
  unique: true,
  partialFilterExpression: {
    'access.publicLink.token': {
      $exists: true,
      $ne: '',
    },
  },
})

EntitySchema.index({
  _id: -1,
  entityId: 1,
  projectBranch: 1,
})

EntitySchema.index({
  entityId: 1,
  workspace: 1,
  project: 1,
})

EntitySchema.index(
  {
    project: 1,
    projectBranch: 1,
    entityId: 1,
  },
  {
    unique: true,
  },
)

EntitySchema.index(
  {
    projectBranch: 1,
    entityId: 1,
  },
  {
    unique: true,
  },
)

EntitySchema.index(
  {
    workspace: 1,
    project: 1,
    projectBranch: 1,
    keyAliases: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      'keyAliases.0': { $exists: true },
      typeOfChangeInBranch: {
        $in: [
          EntityCommitChangeType.ARCHIVE,
          EntityCommitChangeType.CREATE,
          EntityCommitChangeType.UNARCHIVE,
          EntityCommitChangeType.UPDATE,
        ],
      },
      type: {
        $in: EntityTypesWithUniqueAlias,
      },
    },
  },
)

EntitySchema.index({
  entityId: 1,
  latestEntityCommit: 1,
})

EntitySchema.index(
  {
    workspace: 1,
    project: 1,
    projectBranch: 1,
    key: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      createdAtCommit: { $exists: true },
      typeOfChangeInBranch: {
        $in: [
          EntityCommitChangeType.ARCHIVE,
          EntityCommitChangeType.CREATE,
          EntityCommitChangeType.UNARCHIVE,
          EntityCommitChangeType.UPDATE,
        ],
      },
      type: {
        $in: EntityTypesWithUniqueAlias,
      },
    },
  },
)

EntitySchema.index(
  {
    key: 'text',
    keyAliases: 'text',
  },
)

EntitySchema.index(
  {
    workspace: 1,
    project: 1,
    projectBranch: 1,
    default: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      default: { $eq: true },
    },
  },
)

export const EntityModel = mongoose.model<IEntityDocument, IDocumentModel>('Entity', EntitySchema)
