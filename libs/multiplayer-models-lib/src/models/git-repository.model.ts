import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model, Cursor, HydratedDocument } from 'mongoose'
import {
  IGitRepository,
  IntegrationTypeEnum,
  ICursor,
  DataWithCursor,
} from '@multiplayer/types'
import { IWorkspaceUserDocument } from './workspace-user.model'

const { Schema } = mongoose

export interface IGitRepositoryDocument extends Omit<IGitRepository, '_id' | 'project'>, Document {
  _id: ObjectId

  project: ObjectId

  toObject(): IGitRepositoryDocument
  toJSON(): IGitRepository
}

export interface IGitRepositoryModel extends Model<IGitRepositoryDocument> {
  createGitRepository(
    payload: object
  ): Promise<IGitRepositoryDocument>

  createGitRepositories(
    payloads: Array<object>
  ): Promise<Array<IGitRepositoryDocument>>

  findGitRepositoryById(
    id: string | ObjectId
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositoryByUrl(
    url: string
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositoryByName(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    gitRepositoryType: IntegrationTypeEnum.BITBUCKET | IntegrationTypeEnum.GITHUB | IntegrationTypeEnum.GITLAB,
    gitRepositoryOwner: string,
    gitRepositoryName: string,
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositoryByGitId(
    gitRepositoryId: string | ObjectId,
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositoryByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositoryByIdAndAndWorkspace(
    id: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<IGitRepositoryDocument | undefined>

  findGitRepositories(
    filter: {
      archived?: boolean
      project?: string | ObjectId | string[] | ObjectId[]
      workspace?: string | ObjectId
      gitRepositoryId?: string
      gitRepositoryType?: IntegrationTypeEnum
      gitRepositoryPrivate?: boolean,
      gitRepositoryName?: string,
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<IGitRepositoryDocument>>

  updateGitRepositoryById(
    id: string | ObjectId,
    payload: Partial<IGitRepository>
  ): Promise<IGitRepositoryDocument | undefined>

  updateGitRepositoriesByGitId(
    gitId: string,
    payload: any
  ): Promise<IGitRepositoryDocument[]>

  deleteGitRepositoryById(id: string | ObjectId): Promise<void>

  deleteGitRepositoriesByIds(ids: Array<string | ObjectId>): Promise<void>

  deleteGitRepositories(
    filter: {
      gitRepositoryType?: IntegrationTypeEnum,
      workspace?: string | ObjectId,
      project?: string | ObjectId,
      gitRepositoryId?: string | string[],
    },
  ): Promise<void>

  deleteGitRepositoriesByProjectIds(
    workspaceId: string | ObjectId,
    gitRepositoryId: string | ObjectId,
    projectIds: Array<string | ObjectId>
  ): Promise<void>

  getWorkspaceUserByGitRepositoryAndUserId(
    gitRepositoryId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<IWorkspaceUserDocument | undefined>

  getGitRepositoriesInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Cursor<HydratedDocument<IGitRepositoryDocument>>

  deleteGitRepositoriesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteGitRepositoriesByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>
}

const GitRepositorySchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    index: true,
    required: true,
  },
  gitRepository: {
    _id: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      index: true,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(IntegrationTypeEnum),
    },
    private: {
      type: Boolean,
      required: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
    },
    defaultBranch: {
      type: String,
      required: true,
      lowercase: true,
    },
    url: {
      type: String,
      required: true,
      lowercase: true,
    },
  },
  archived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

GitRepositorySchema.statics.createGitRepository = function (payload: any) {
  return this.findOneAndUpdate(
    {
      workspace: payload.workspace,
      project: payload.project,
      'gitRepository._id': payload.gitRepository._id,
    },
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

GitRepositorySchema.statics.createGitRepositories = function (payloads: Array<object>) {
  return this.insertMany(payloads)
}

GitRepositorySchema.statics.findGitRepositoryById = function (
  id: string | ObjectId,
) {
  return this.findOne({ _id: id })
}

GitRepositorySchema.statics.findGitRepositoryByUrl = function (
  url: string,
): Promise<IGitRepositoryDocument | undefined> {
  return this.findOne({
    'gitRepository.url': url,
  })
}

GitRepositorySchema.statics.findGitRepositoryByName = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  gitRepositoryType: IntegrationTypeEnum.BITBUCKET | IntegrationTypeEnum.GITHUB | IntegrationTypeEnum.GITLAB,
  gitRepositoryOwner: string,
  gitRepositoryName: string,
): Promise<IGitRepositoryDocument | undefined> {
  return this.findOne({
    workspace: workspaceId,
    project: projectId,
    'gitRepository.type': gitRepositoryType,
    'gitRepository.owner': {
      $regex: `^${gitRepositoryOwner}$`,
      $options: 'i',
    },
    'gitRepository.name': {
      $regex: `^${gitRepositoryName}$`,
      $options: 'i',
    },
  })
}

GitRepositorySchema.statics.findGitRepositoryByGitId = async function (
  gitRepositoryId: string | ObjectId,
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<IGitRepositoryDocument | undefined> {
  return this.findOne({
    workspace: workspaceId,
    project: projectId,
    'gitRepository.id': gitRepositoryId,
  })
}

GitRepositorySchema.statics.findGitRepositories = async function (
  filter: {
    archived?: boolean
    project?: string | ObjectId | string[] | ObjectId[]
    workspace?: string | ObjectId
    gitRepositoryId?: string
    gitRepositoryType?: IntegrationTypeEnum
    gitRepositoryPrivate?: boolean,
    gitRepositoryName?: string,
  },
  cursor: ICursor = {},
) {
  const conditions: any = {}

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  if (filter.project) {
    conditions.project = Array.isArray(filter.project)
      ? filter.project.map(projectId => new ObjectId(projectId))
      : new ObjectId(filter.project)
  }

  if (filter.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  if (filter.gitRepositoryId) {
    conditions['gitRepository._id'] = filter.gitRepositoryId
  }

  if (filter.gitRepositoryType) {
    conditions['gitRepository.type'] = filter.gitRepositoryType
  }


  if (filter.gitRepositoryName) {
    conditions['gitRepository.name'] = {
      $regex: filter.gitRepositoryName,
      $options: 'i',
    }
  }

  if (typeof filter?.gitRepositoryPrivate === 'boolean') {
    if (!filter.gitRepositoryPrivate) {
      conditions['gitRepository.private'] = {
        $ne: filter.gitRepositoryPrivate,
      }
    } else {
      conditions['gitRepository.private'] = filter.gitRepositoryPrivate
    }
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

GitRepositorySchema.statics.findGitRepositoryByIdAndProjectAndWorkspace = function (
  id: string | ObjectId,
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

GitRepositorySchema.statics.findGitRepositoryByIdAndAndWorkspace = function (
  id: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
  })
}

GitRepositorySchema.statics.updateGitRepositoryById = function (
  id: string | ObjectId,
  payload: object,
) {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

GitRepositorySchema.statics.updateGitRepositoriesByGitId = function (
  gitId: string,
  payload: Partial<IGitRepository>,
): Promise<IGitRepositoryDocument[]> {
  return this.updateMany(
    {
      'gitRepository.id': gitId,
    },
    {
      $set: payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

GitRepositorySchema.statics.deleteGitRepositoryById = function (
  id: string | ObjectId,
) {
  return this.deleteOne({ _id: id })
}

GitRepositorySchema.statics.deleteGitRepositoriesByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

GitRepositorySchema.statics.deleteGitRepositories = function (
  filter: {
    gitRepositoryType?: IntegrationTypeEnum,
    workspace?: string | ObjectId,
    project?: string | ObjectId,
    gitRepositoryId?: string | string[],
  },
) {
  const conditions: any = {}

  if (filter.gitRepositoryType) {
    conditions['gitRepository.type'] = filter.gitRepositoryType
  }

  if (filter.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
  }

  if (filter.gitRepositoryId) {
    conditions['gitRepository.id'] = Array.isArray(filter.gitRepositoryId)
      ? { $in: filter.gitRepositoryId }
      : filter.gitRepositoryId
  }

  return this.deleteMany(conditions)
}

GitRepositorySchema.statics.deleteGitRepositoriesByProjectIds = function (
  workspaceId: string | ObjectId,
  gitRepositoryId: string | ObjectId,
  projectIds: Array<string | ObjectId>,
) {
  return this.deleteMany({
    workspace: new ObjectId(workspaceId),
    'gitRepository.id': gitRepositoryId,
    project: {
      $in: projectIds.map(projectId => new ObjectId(projectId)),
    },
  })
}

GitRepositorySchema.statics.getWorkspaceUserByGitRepositoryAndUserId = async function (
  gitRepositoryId: string | ObjectId,
  userId: string | ObjectId,
): Promise<IWorkspaceUserDocument | undefined> {
  const res = await this.aggregate([
    {
      $match: {
        _id: new ObjectId(gitRepositoryId),
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

GitRepositorySchema.statics.getGitRepositoriesInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Cursor<HydratedDocument<IGitRepositoryDocument>> {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 })
}

GitRepositorySchema.statics.deleteGitRepositoriesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

GitRepositorySchema.statics.deleteGitRepositoriesByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

GitRepositorySchema.index({
  project: 1,
  'gitRepository.id': 1,
}, {
  unique: true,
})

export const GitRepositoryModel = mongoose.model<IGitRepositoryDocument, IGitRepositoryModel>('Git-Repository', GitRepositorySchema)
