import { mongoose, ObjectId } from '@multiplayer/mongo'
import {
  Model,
  PipelineStage,
} from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IProjectLink,
  ProjectLinkObjectType,
  ICursor,
  DataWithCursor,
  IntegrationTypeEnum,
  EntityType,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { GitRefSchema } from './shared/git-ref.model'

const { Schema } = mongoose
export interface IProjectLinkDocument extends Omit<IProjectLink, '_id' | 'projectBranch' | 'createdAtCommit' | 'archivedAtCommit' | 'deletedAtCommit' | 'workspace' | 'project'>, Document {
  _id: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId | string

  createdAtCommit: ObjectId | string

  archivedAtCommit: ObjectId | string

  deletedAtCommit: ObjectId | string | null

  toObject(): IProjectLinkDocument
  toJSON(): IProjectLink
}

const getPipelineStagesPopulateObjects = (
  projectBranchIds: ObjectId[],
): PipelineStage.FacetPipelineStage[] => ([
  {
    $lookup: {
      from: 'entities',
      localField: 'sourceObject',
      foreignField: 'entityId',
      as: 'sourceObject',
      pipeline: [{
        $match: {
          projectBranch: { $in: projectBranchIds },
        },
      }, {
        $sort: {
          projectBranch: -1,
        },
      }, {
        $limit: 1,
      }],
    },
  },
  {
    $unwind: {
      path: '$sourceObject',
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: 'entities',
      localField: 'targetObject',
      foreignField: 'entityId',
      as: 'targetObject',
      pipeline: [{
        $match: {
          projectBranch: { $in: projectBranchIds },
        },
      }, {
        $sort: {
          projectBranch: -1,
        },
      }, {
        $limit: 1,
      }],
    },
  },
  {
    $unwind: {
      path: '$targetObject',
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: 'git-repositories',
      localField: 'sourceGitRef.repositoryId',
      foreignField: 'gitRepository.id',
      as: 'sourceGitRepository',
      let: {
        workspace: '$workspace',
        project: '$project',
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$workspace', '$$workspace'],
            }, {
              $eq: ['$project', '$$project'],
            }],
          },
        },
      }, {
        $limit: 1,
      }],
    },
  },
  {
    $unwind: {
      path: '$sourceGitRepository',
      preserveNullAndEmptyArrays: true,
    },
  },
])

export interface IProjectProjectLinkModel extends Model<IProjectLinkDocument> {
  createProjectLink(
    payload: Partial<IProjectLink> | Partial<IProjectLinkDocument>,
  ): Promise<IProjectLinkDocument>

  findProjectLinkById(
    projectLinkId: string | ObjectId,
    projectBranchIds?: string[] | ObjectId[],
  ): Promise<IProjectLinkDocument | undefined>

  findProjectLinks(
    filter: Omit<Partial<IProjectLink>, 'deletedAtCommit'> & {
      archived?: boolean
      sourceGitRefRepositoryId?: string
      sourceGitRefBranch?: string
      sourceGitRefPath?: string
      sourceGitRefType?: IntegrationTypeEnum
      targetObjectId?: string
      sourceObjectId?: string,
      deletedAtCommit?: string | ObjectId | { $exists: boolean } | null
    },
    cursor?: ICursor,
    projectBranchIds?: ObjectId[],
  ): Promise<DataWithCursor<IProjectLinkDocument>>

  findProjectLinkByIdAndProjectAndWorkspace(
    projectLinkId: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IProjectLinkDocument | undefined>

  getProjectLinkState(
    projectBranchIds: string[] | ObjectId[],
    filter?: Partial<Omit<IProjectLink, 'targetObjectType' | 'sourceObjectType' | 'targetEntityType' | 'sourceEntityType'>> & {
      archived?: boolean
      sourceGitRefRepositoryId?: string
      sourceGitRefBranch?: string
      sourceGitRefPath?: string
      sourceGitRefType?: IntegrationTypeEnum
      targetObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
      sourceObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
      targetObjectId?: string | ObjectId | string[] | ObjectId[]
      sourceObjectId?: string | ObjectId | string[] | ObjectId[]
      withDeleted?: boolean
      targetEntityType?: EntityType | EntityType[]
      sourceEntityType?: EntityType | EntityType[]
      sourceObjectEntityTypesToExclude?: EntityType[]
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IProjectLinkDocument & { sourceObject: any, targetObject: any } >>

  updateProjectLinkById(
    projectLinkId: string | ObjectId,
    projectBranch: string | ObjectId,
    payload: Partial<IProjectLink>,
  ): Promise<IProjectLinkDocument | undefined>

  updateProjectLinkGitPath(
    gitRepositoryId: string,
    gitBranch: string,
    oldGitPath: string,
    newGitPath: string,
  ): Promise<IProjectLinkDocument | undefined>

  deleteProjectLinkById(
    projectLinkId: string | ObjectId,
    projectBranchId: string | ObjectId,
  ): Promise<void>

  deleteProjectLinkByProjectBranch(
    projectBranchId: string | ObjectId
  ): Promise<void>

  deleteProjectLinkBySourceAndTarget(
    projectBranch: string | ObjectId,
    sourceObject: string | ObjectId,
    targetObject: string | ObjectId,
  ): Promise<void>

  deleteProjectLinksByIds(
    projectLinkIds: Array<string | ObjectId>,
    projectBranch: string | ObjectId
  ): Promise<void>

  findProjectLinksByParams(
    projectBranchIds: ObjectId[],
    filter: {
      _id?: string | ObjectId,
      sourceObjectId?: string | ObjectId,
      targetObjectId?: string | ObjectId,
      sourceGitRefRepositoryId?: string | ObjectId,
    }
  ): Promise<IProjectLinkDocument[]>

  updateManyLinks(
    filter: {
      projectBranch: string | ObjectId,
      deletedAtCommit: string | ObjectId | { $exists: boolean },
    },
    payload: Partial<IProjectLink>,
  ): Promise<IProjectLinkDocument[]>

  deleteManyLinks(filter, options?): Promise<void>

  findDeletedLinks(branchId: string | ObjectId): Promise<IProjectLinkDocument[]>

  deleteProjectLinksByRepository(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    gitRepoType: IntegrationTypeEnum,
    gitRepoGitId: string,
  ): Promise<void>

  getProjectLinksInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IProjectLink>
  ): any

  deleteProjectLinksByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteProjectLinksByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>
}

const ProjectLinkSchema = new Schema({
  projectLinkId: {
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
  sourceObjectType: {
    type: String,
    required: true,
    enum: Object.values(ProjectLinkObjectType),
  },
  sourceEntityType: {
    type: String,
    enum: Object.values(EntityType),
  },
  sourceObject: {
    type: ObjectId,
    refPath: 'sourceObjectType',
  },
  sourceUri: {
    type: String,
  },
  sourceGitRef: GitRefSchema,
  targetObject: {
    type: ObjectId,
    refPath: 'targetObjectType',
    required: true,
  },
  targetEntityType: {
    type: String,
    enum: Object.values(EntityType),
  },
  targetObjectType: {
    type: String,
    required: true,
    enum: Object.values(ProjectLinkObjectType),
  },
  createdAtCommit: {
    type: ObjectId,
    ref: 'Commit',
    required: true,
  },
  archivedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  deletedAtCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
}, {
  timestamps: true,
})

ProjectLinkSchema.statics.createProjectLink = async function (
  payload: Partial<IProjectLink>,
) {
  if (!payload.projectLinkId) {
    payload.projectLinkId = new ObjectId().toString()
  }

  const {
    _id,
    projectLinkId,
    createdAtCommit,
    archivedAtCommit,
    deletedAtCommit,
    createdAt,
    updatedAt,
    ...upsertQuery
  } = payload

  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  return this.findOneAndUpdate(
    MongoPayload.flattenObject(upsertQuery),
    {
      $set: set,
      $unset: unset,
    },
    {
      upsert: true,
      new: true,
    },
  )
}

ProjectLinkSchema.statics.updateManyLinks = async function (
  filter: {
    projectBranch: string | ObjectId,
    deletedAtCommit: string | ObjectId | { $exists: false },
  },
  payload: Partial<IProjectLink>,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  return this.updateMany(
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

ProjectLinkSchema.statics.deleteManyLinks = async function (filter, options?) {
  return this.deleteMany(filter, options)
}

ProjectLinkSchema.statics.findDeletedLinks = async function (branchId: string): Promise<IProjectLinkDocument[]> {
  return this.find({ projectBranch: branchId, deletedAtCommit: { $exists: true } })
}

ProjectLinkSchema.statics.findProjectLinkById = async function (
  projectLinkId: string | ObjectId,
  projectBranchIds?: ObjectId[],
) {
  const [projectLink] = await this.aggregate([
    {
      $match: {
        projectLinkId: new ObjectId(projectLinkId),
      },
    },
    ...projectBranchIds?.length
      ? getPipelineStagesPopulateObjects(projectBranchIds)
      : [],
  ])

  return projectLink
}

ProjectLinkSchema.statics.findProjectLinks = async function (
  filter: Omit<Partial<IProjectLink>, 'deletedAtCommit'> & {
    archived?: boolean
    sourceGitRefRepositoryId?: string
    sourceGitRefBranch?: string
    sourceGitRefPath?: string
    sourceGitRefType?: IntegrationTypeEnum
    targetObjectId?: string
    sourceObjectId?: string,
    deletedAtCommit?: string | ObjectId | { $exists: boolean } | null
  },
  cursor?: ICursor,
  projectBranchIds?: ObjectId[],
) {
  const conditions: any = {
    projectBranch: new ObjectId(filter.projectBranch),
  }

  if (filter?.archived) {
    conditions.archivedAtCommit = { $exists: false }
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.sourceGitRefRepositoryId) {
    conditions['sourceGitRef.repositoryId'] = filter.sourceGitRefRepositoryId
  }

  if (filter.sourceGitRefBranch) {
    conditions['sourceGitRef.branch'] = filter.sourceGitRefBranch
  }

  if (filter?.targetObjectId) {
    conditions.targetObject = new ObjectId(filter.targetObjectId)
  }

  if (filter?.sourceObjectId) {
    conditions.sourceObject = new ObjectId(filter.sourceObjectId)
  }

  if (filter.sourceGitRefType) {
    conditions['sourceGitRef.type'] = filter.sourceGitRefType
  }

  if (filter.sourceGitRefPath) {
    conditions['sourceGitRef.path'] = filter.sourceGitRefPath
  }

  if (filter.deletedAtCommit) {
    conditions.deletedAtCommit = filter.deletedAtCommit
  }

  const pipeline: PipelineStage[] = [
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
          ...projectBranchIds
            ? getPipelineStagesPopulateObjects(projectBranchIds)
            : [],
        ],
      },
    },
  ]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      ...cursor?.skip ? { skip: cursor.skip } : {},
      ...cursor?.limit ? { limit: cursor.limit } : {},
    },
  }
}

ProjectLinkSchema.statics.findProjectLinksByParams = async function (
  projectBranchIds: ObjectId[],
  filter: {
    projectLinkId?: string | ObjectId,
    sourceObjectId?: string | ObjectId,
    targetObjectId?: string | ObjectId,
    sourceGitRefRepositoryId?: string | ObjectId,
  },
): Promise<IProjectLinkDocument[]> {
  const conditions: any = {}

  if (filter.projectLinkId) {
    conditions.projectLinkId = new ObjectId(filter.projectLinkId)
  } else {
    if (filter.sourceObjectId) {
      conditions.sourceObject = new ObjectId(filter.sourceObjectId)
    }

    if (filter.sourceGitRefRepositoryId) {
      conditions['sourceGitRef.repositoryId'] = filter.sourceGitRefRepositoryId
    }

    if (filter.targetObjectId) {
      conditions.targetObject = new ObjectId(filter.targetObjectId)
    }
  }

  if (!Object.keys(conditions).length) {
    throw new Error('INVALID_FILTER')
  }

  conditions.projectBranch = {
    $in: projectBranchIds
      .map(projectBranchId => new ObjectId(projectBranchId)),
  }

  const result = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $group: {
        _id: '$projectLinkId',
        link: {
          $last: '$$ROOT',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$$ROOT.link',
      },
    },
  ])

  return result
}

ProjectLinkSchema.statics.findProjectLinkByIdAndProjectAndWorkspace = function (
  projectLinkId: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    projectLinkId,
    workspace: workspaceId,
    project: projectId,
  })
}

ProjectLinkSchema.statics.getProjectLinkState = async function (
  projectBranchIds: ObjectId[],
  filter?: Partial<Omit<IProjectLink, 'targetObjectType' | 'sourceObjectType' | 'targetEntityType' | 'sourceEntityType'>> & {
    archived?: boolean
    sourceGitRefRepositoryId?: string
    sourceGitRefBranch?: string
    sourceGitRefPath?: string
    sourceGitRefType?: IntegrationTypeEnum
    targetObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
    sourceObjectType?: ProjectLinkObjectType | ProjectLinkObjectType[]
    targetObjectId?: string | ObjectId | string[] | ObjectId[]
    sourceObjectId?: string | ObjectId | string[] | ObjectId[]
    withDeleted: boolean
    targetEntityType?: EntityType | EntityType[]
    sourceEntityType?: EntityType | EntityType[]
    sourceObjectEntityTypesToExclude?: EntityType[]
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
): Promise<DataWithCursor<IProjectLinkDocument & { sourceObject: any, targetObject: any }>> {
  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort['_id'] = -1
  }

  const conditions: any = {
    projectBranch: {
      $in: projectBranchIds.map(projectBranchId => new ObjectId(projectBranchId)),
    },
  }
  const filterAfterGroup: PipelineStage[] = []
  if (!filter?.withDeleted) {
    filterAfterGroup.push({
      $match: { deletedAtCommit: { $exists: false } },
    })
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

  if (filter?.sourceGitRefRepositoryId) {
    conditions['sourceGitRef.repositoryId'] = filter.sourceGitRefRepositoryId
  }

  if (filter?.sourceGitRefBranch) {
    conditions['sourceGitRef.branch'] = filter.sourceGitRefBranch
  }

  if (filter?.sourceGitRefType) {
    conditions['sourceGitRef.type'] = filter.sourceGitRefType
  }

  if (filter?.sourceGitRefPath) {
    conditions['sourceGitRef.path'] = filter.sourceGitRefPath
  }

  if (filter?.sourceObjectEntityTypesToExclude) {
    conditions.sourceEntityType = { $nin: filter.sourceObjectEntityTypesToExclude }
  }

  const sourceObject: any = {}
  const targetObject: any = {}

  if (filter?.targetObjectId) {
    targetObject.Object = Array.isArray(filter.targetObjectId)
      ? filter.targetObjectId.map((id) => new ObjectId(id))
      : new ObjectId(filter.targetObjectId)
  }

  if (filter?.targetObjectType) {
    targetObject.ObjectType = Array.isArray(filter.targetObjectType)
      ? { $in: filter.targetObjectType }
      : filter.targetObjectType
  }

  if (filter?.targetEntityType) {
    targetObject.EntityType = Array.isArray(filter.targetEntityType)
      ? { $in: filter.targetEntityType }
      : filter.targetEntityType
  }

  if (filter?.sourceObjectId) {
    sourceObject.Object = Array.isArray(filter.sourceObjectId)
      ? filter.sourceObjectId.map((id) => new ObjectId(id))
      : new ObjectId(filter.sourceObjectId)
  }

  if (filter?.sourceObjectType) {
    sourceObject.ObjectType = Array.isArray(filter.sourceObjectType)
      ? { $in: filter.sourceObjectType }
      : filter.sourceObjectType
  }

  if (filter?.sourceEntityType) {
    sourceObject.EntityType = Array.isArray(filter.sourceEntityType)
      ? { $in: filter.sourceEntityType }
      : filter.sourceEntityType
  }

  if (
    Object.keys(sourceObject).length
    || Object.keys(targetObject).length
  ) {
    conditions.$or = [
      {
        ...Object.keys(sourceObject).length
          ? MongoPayload.prependToKeys(sourceObject, 'source', false)
          : {},
        ...Object.keys(targetObject).length
          ? MongoPayload.prependToKeys(targetObject, 'target', false)
          : {},
      },
      {
        ...Object.keys(sourceObject).length
          ? MongoPayload.prependToKeys(sourceObject, 'target', false)
          : {},
        ...Object.keys(targetObject).length
          ? MongoPayload.prependToKeys(targetObject, 'source', false)
          : {},
      },
    ]
  }

  const pipeline: PipelineStage[] = [
    {
      $match: {
        ...conditions,
      },
    },
    {
      $group: {
        _id: '$projectLinkId',
        link: {
          $last: '$$ROOT',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$$ROOT.link',
      },
    },
    ...filterAfterGroup,
    {
      $sort: _sort,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...cursor?.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor?.limit ? [{ $limit: cursor.limit }] : [],
          ...getPipelineStagesPopulateObjects(projectBranchIds),
        ],
      },
    },
  ]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      ...cursor?.skip ? { skip: cursor.skip } : {},
      ...cursor?.limit ? { limit: cursor.limit } : {},
    },
  }
}

ProjectLinkSchema.statics.updateProjectLinkById = async function (
  projectLinkId: string | ObjectId,
  projectBranch: string | ObjectId,
  payload: Partial<IProjectLink>,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  const projectLink = await this.findOneAndUpdate(
    {
      projectLinkId,
      projectBranch,
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

  return projectLink
}

ProjectLinkSchema.statics.updateProjectLinkGitPath = async function (
  gitRepositoryId: string,
  gitBranch: string,
  oldGitPath: string,
  newGitPath: string,
) {
  const projectLink = await this.findOneAndUpdate(
    {
      'sourceGitRef.repositoryId': gitRepositoryId,
      'sourceGitRef.path': oldGitPath,
      'sourceGitRef.branch': gitBranch,
    },
    {
      $set: {
        'sourceGitRef.path': newGitPath,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  return projectLink
}

ProjectLinkSchema.statics.deleteProjectLinkById = function (
  projectLinkId: string | ObjectId,
  projectBranchId: string | ObjectId,
) {
  return this.deleteOne({
    projectLinkId,
    projectBranch: projectBranchId,
  })
}

ProjectLinkSchema.statics.deleteProjectLinkByProjectBranch = function (
  projectBranchId: string | ObjectId,
) {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}

ProjectLinkSchema.statics.deleteProjectLinksByIds = function (
  projectLinkIds: Array<string | ObjectId>,
  projectBranch: string | ObjectId,
) {
  return this.deleteMany({
    projectLinkId: { $in: projectLinkIds },
    projectBranch,
  })
}

ProjectLinkSchema.statics.deleteProjectLinkBySourceAndTarget = function (
  projectBranch: string | ObjectId,
  sourceObject: string | ObjectId,
  targetObject: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch,
    sourceObject,
    targetObject,
  })
}
ProjectLinkSchema.statics.deleteProjectLinksByRepository = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  gitRepoType: IntegrationTypeEnum,
  gitRepoGitId: string,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
    'sourceGitRef.repositoryType': gitRepoType,
    'sourceGitRef.repositoryId': gitRepoGitId,
  })
}

ProjectLinkSchema.statics.getProjectLinksInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IProjectLink>,
): any {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

ProjectLinkSchema.statics.deleteProjectLinksByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ProjectLinkSchema.statics.deleteProjectLinksByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

ProjectLinkSchema.index({
  'sourceGitRef.repositoryId': 1,
  'sourceGitRef.path': 1,
  'sourceGitRef.branch': 1,
}, {
  sparse: true,
})

ProjectLinkSchema.index({
  workspace: 1,
  project: 1,
  projectBranch: 1,
  sourceObject: 1,
  targetObject: 1,
}, {
  unique: true,
  partialFilterExpression: {
    sourceObject: { $exists: true },
    targetObject: { $exists: true },
  },
})

ProjectLinkSchema.index({
  workspace: 1,
  project: 1,
  projectBranch: 1,
  'sourceGitRef.repositoryId': 1,
  'sourceGitRef.path': 1,
  'sourceGitRef.branch': 1,
  targetObject: 1,
}, {
  unique: true,
  partialFilterExpression: {
    sourceObject: { $exists: false },
    sourceGitRef: { $exists: true },
  },
})

ProjectLinkSchema.index(
  {
    projectBranch: 1,
    projectLinkId: 1,
  },
  {
    unique: true,
  },
)

ProjectLinkSchema.index({
  project: 1,
  projectBranch: 1,
  workspace: 1,
  _id: 1,
})

export const ProjectLinkModel = mongoose.model<
IProjectLinkDocument,
IProjectProjectLinkModel
>('Project-Link', ProjectLinkSchema)
