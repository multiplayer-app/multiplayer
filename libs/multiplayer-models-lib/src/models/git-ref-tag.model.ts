import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, PipelineStage } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IGitRefTag,
  SystemTag,
  ICursor,
  DataWithCursor,
  IntegrationTypeEnum,
  GitRefTagType,
} from '@multiplayer/types'
import {
  ISortOptions,
} from '../types'
import { GitRefSchema } from './shared/git-ref.model'
import { TagSchema } from './shared/tag.model'

const { Schema } = mongoose

export interface IGitRefTagDocument extends Omit<IGitRefTag, '_id' | 'projectBranch' | 'createdAtCommit' | 'archivedAtCommit' | 'deletedAtCommit' | 'workspace' | 'project'>, Document {
  _id: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId | string

  createdAtCommit: ObjectId | string

  archivedAtCommit: ObjectId | string

  deletedAtCommit: ObjectId | string

  toObject(): IGitRefTagDocument
  toJSON(): IGitRefTagDocument
}

export interface IGitRefTagModel extends Model<IGitRefTagDocument> {
  createGitRefTag(
    payload: Partial<IGitRefTag | IGitRefTagDocument>
  ): Promise<IGitRefTagDocument>

  findGitRefTagById(
    gitRefTagId: string | ObjectId,
    projectBranchIds?: string | ObjectId | string[] | ObjectId[],
  ): Promise<IGitRefTagDocument | undefined>

  findGitRefTags(
    filter: Omit<Partial<IGitRefTag>, 'deletedAtCommit'> & {
      deletedAtCommit?: string | ObjectId | { $exists: boolean },
      archived?: boolean
      gitRefRepositoryId?: string
      gitRefBranch?: string
      gitRefPath?: string
      gitRefType?: IntegrationTypeEnum
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<IGitRefTagDocument>>

  findGitRefTagByIdAndProjectAndWorkspace(
    gitRefTagId: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IGitRefTagDocument | undefined>

  findDeletedGitRefTags(
    projectBranch: string | ObjectId
  ): Promise<IGitRefTagDocument[]>

  getGitRefTagState(
    projectBranchTreeIds: string[] | ObjectId[],
    filter?: Partial<IGitRefTag> & {
      archived?: boolean
      gitRefTagId?: ObjectId | string
      gitRefRepositoryId?: string
      gitRefBranch?: string
      gitRefPath?: string
      gitRefType?: IntegrationTypeEnum
      type?: GitRefTagType
      withDeleted?: boolean
    },
    cursor?: ICursor,
    mergeCommitId?: string | ObjectId,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IGitRefTagDocument>>

  updateGitRefTagById(
    gitRefTagId: string | ObjectId,
    projectBranch: string | ObjectId,
    payload: Partial<IGitRefTag>
  ): Promise<IGitRefTagDocument | undefined>

  updateGitRefTagGitPath(
    gitRepositoryId: string,
    gitBranch: string,
    oldGitPath: string,
    newGitPath: string,
  ): Promise<IGitRefTagDocument | undefined>

  updateManyGitRefTags(
    filter: {
      projectBranch: string | ObjectId,
      deletedAtCommit: string | ObjectId | { $exists: boolean },
    },
    payload: Partial<IGitRefTag>
  ): Promise<IGitRefTagDocument[]>

  deleteGitRefTagById(
    gitRefTagId: string | ObjectId,
    projectBranch: string | ObjectId | string[] | ObjectId[]
  ): Promise<void>

  deleteGitRefTagByBranchId(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    projectBranch: string | ObjectId
  ): Promise<void>

  deleteGitRefTagsByIds(
    gitRefTagIds: Array<string | ObjectId>,
    projectBranch: string | ObjectId
  ): Promise<void>

  deleteManyGitRefTags(
    filter,
    options?
  ): Promise<void>

  deleteGitRefTagsByRepository(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    gitRepoType: IntegrationTypeEnum,
    gitRepoGitId: string,
  ): Promise<void>

  deleteGitRefTagsByProjectBranch(
    projectBranchId: string | ObjectId | string[] | ObjectId[],
    type?: GitRefTagType,
  ): Promise<void>

  getGitRefTagsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter?: Partial<IGitRefTag>
  ): any

  deleteGitRefTagsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteGitRefTagsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  getUniqueTags(
    filter: {
      workspaceId: string | ObjectId,
      projectId: string | ObjectId,
    }
  ): Promise<string[]>
}

const GitRefTagSchema = new Schema({
  gitRefTagId: {
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
  type: {
    type: String,
    required: true,
    enum: Object.values(GitRefTagType),
  },
  projectBranch: {
    type: ObjectId,
    ref: 'Project-Branch',
    required: true,
  },
  gitRef: GitRefSchema,
  tags: [TagSchema],
  systemTags: [{
    type: String,
    enum: Object.values(SystemTag),
  }],
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

GitRefTagSchema.statics.createGitRefTag = async function (
  payload: Partial<IGitRefTag>,
) {
  const gitRefTag = await new this(payload).save()

  return gitRefTag
}

GitRefTagSchema.statics.updateManyGitRefTags = async function (
  filter: {
    projectBranch: string | ObjectId,
    deletedAtCommit: string | ObjectId | { $exists: boolean },
  },
  payload: Partial<IGitRefTag>,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  return this.updateMany(
    filter,
    {
      $set: set,
      $unset: unset,
    }, {
      new: true,
      runValidators: true,
    },
  )
}

GitRefTagSchema.statics.deleteManyGitRefTags = async function (
  filter,
  options?,
) {
  return this.deleteMany(filter, options)
}

GitRefTagSchema.statics.findDeletedGitRefTags = async function (
  projectBranch: string,
): Promise<IGitRefTagDocument[]> {
  return this.find({
    projectBranch,
    deletedAtCommit: { $exists: true },
  })
}

GitRefTagSchema.statics.findGitRefTagById = async function (
  gitRefTagId: string | ObjectId,
  projectBranchIds?: string | ObjectId | string[] | ObjectId[],
) {
  const conditions: any = {
    gitRefTagId: new ObjectId(gitRefTagId),
  }

  if (projectBranchIds) {
    conditions.projectBranch = Array.isArray(projectBranchIds)
      ? { $in: projectBranchIds.map(id => new ObjectId(id)) }
      : new ObjectId(projectBranchIds)
  }

  const [gitRefTag] = await this.aggregate([{
    $match: conditions,
  }, {
    $sort: {
      projectBranch: -1,
    },
  }, {
    $limit: 1,
  }])

  return gitRefTag
}

GitRefTagSchema.statics.findGitRefTags = async function (
  filter: Omit<Partial<IGitRefTag>, 'deletedAtCommit'> & {
    deletedAtCommit?: string | ObjectId | { $exists: boolean },
    archived?: boolean
    gitRefRepositoryId?: string
    gitRefBranch?: string
    gitRefPath?: string
    gitRefType?: IntegrationTypeEnum
  },
  cursor: ICursor = {},
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

  if (filter.gitRefRepositoryId) {
    conditions['gitRef.repositoryId'] = filter.gitRefRepositoryId
  }

  if (filter.gitRefBranch) {
    conditions['gitRef.branch'] = filter.gitRefBranch
  }

  if (filter.gitRefType) {
    conditions['gitRef.type'] = filter.gitRefType
  }

  if (filter.gitRefPath) {
    conditions['gitRef.path'] = filter.gitRefPath
  }

  if (filter.deletedAtCommit) {
    conditions.deletedAtCommit = filter.deletedAtCommit
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
          ...cursor.skip ? [{ $skip: cursor.skip }] : [],
          ...cursor.limit ? [{ $limit: cursor.limit }] : [],
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

GitRefTagSchema.statics.findGitRefTagByIdAndProjectAndWorkspace = function (
  gitRefTagId: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    gitRefTagId,
    workspace: workspaceId,
    project: projectId,
  })
}

GitRefTagSchema.statics.getGitRefTagState = async function (
  projectBranchTreeIds: string[] | ObjectId[],
  filter?: Partial<IGitRefTag> & {
    archived?: boolean
    gitRefTagId?: ObjectId | string
    gitRefRepositoryId?: string
    gitRefBranch?: string
    gitRefPath?: string
    gitRefType?: IntegrationTypeEnum
    type?: GitRefTagType
    withDeleted?: boolean
  },
  cursor?: ICursor,
  mergeCommitId?: string | ObjectId,
  sort?: ISortOptions,
): Promise<DataWithCursor<IGitRefTagDocument>> {
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

  if (filter?.gitRefRepositoryId) {
    conditions['gitRef.repositoryId'] = filter.gitRefRepositoryId
  }

  if (filter?.gitRefBranch) {
    conditions['gitRef.branch'] = filter.gitRefBranch
  }

  if (filter?.gitRefType) {
    conditions['gitRef.type'] = filter.gitRefType
  }

  if (filter?.gitRefPath) {
    conditions['gitRef.path'] = filter.gitRefPath
  }

  if (filter?.type) {
    conditions.type = filter.type
  }

  if (filter?.gitRefTagId) {
    conditions.gitRefTagId = new ObjectId(filter.gitRefTagId)
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
      },
    },
    {
      $group: {
        _id: '$gitRefTagId',
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

GitRefTagSchema.statics.updateGitRefTagById = async function (
  gitRefTagId: string | ObjectId,
  projectBranch: string | ObjectId,
  payload: Partial<IGitRefTag>,
) {
  const { set, unset } = MongoPayload.prepareUpdateParams(payload)

  const gitRefTag = await this.findOneAndUpdate(
    {
      gitRefTagId,
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

  return gitRefTag
}

GitRefTagSchema.statics.updateGitRefTagGitPath = async function (
  gitRepositoryId: string,
  gitBranch: string,
  oldGitPath: string,
  newGitPath: string,
) {
  const gitRefTag = await this.findOneAndUpdate(
    {
      'gitRef.repositoryId': gitRepositoryId,
      'gitRef.path': oldGitPath,
      'gitRef.branch': gitBranch,
    },
    {
      $set: {
        'gitRef.path': newGitPath,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  return gitRefTag
}

GitRefTagSchema.statics.deleteGitRefTagById = function (
  gitRefTagId: string | ObjectId,
  projectBranch: string | ObjectId | string[] | ObjectId[],
) {
  const conditions: any = {
    gitRefTagId,
  }

  if (Array.isArray(projectBranch)) {
    conditions.projectBranch = {
      $in: projectBranch,
    }
  } else {
    conditions.projectBranch = projectBranch
  }

  return this.deleteOne(conditions)
}

GitRefTagSchema.statics.deleteGitRefTagsByIds = function (
  gitRefTagIds: Array<string | ObjectId>,
  projectBranch: string | ObjectId,
) {
  return this.deleteMany({
    gitRefTagId: { $in: gitRefTagIds },
    projectBranch,
  })
}

GitRefTagSchema.statics.deleteGitRefTagsByProjectBranch = function (
  projectBranchId: string | ObjectId | string[] | ObjectId[],
  type?: GitRefTagType,
): Promise<void> {
  const conditions: any = {}

  if (Array.isArray(projectBranchId)) {
    conditions.projectBranch = {
      $in: projectBranchId,
    }
  } else {
    conditions.projectBranch = projectBranchId
  }

  if (type) {
    conditions.type = type
  }

  return this.deleteMany(conditions)
}

GitRefTagSchema.statics.deleteGitRefTagsByRepository = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  gitRepoType: IntegrationTypeEnum,
  gitRepoGitId: string,
) {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
    'gitRef.repositoryType': gitRepoType,
    'gitRef.repositoryId': gitRepoGitId,
  })
}

GitRefTagSchema.statics.getGitRefTagsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter?: Partial<IGitRefTag>,
): any {
  return this.find({
    ...(filter || {}),
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

GitRefTagSchema.statics.deleteGitRefTagsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

GitRefTagSchema.statics.deleteGitRefTagsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

GitRefTagSchema.statics.getUniqueTags = async function (filter: {
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

GitRefTagSchema.index({
  'gitRef.repositoryId': 1,
  'gitRef.path': 1,
  'gitRef.branch': 1,
}, {
  sparse: true,
})

GitRefTagSchema.index({
  gitRefTagId: 1,
  projectBranch: 1,
}, {
  unique: true,
})

GitRefTagSchema.index({
  workspace: 1,
  project: 1,
})

export const GitRefTagModel = mongoose.model<IGitRefTagDocument, IGitRefTagModel>('Git-Ref-Tag', GitRefTagSchema)
