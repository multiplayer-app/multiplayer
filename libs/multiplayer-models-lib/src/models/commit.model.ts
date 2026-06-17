import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  ICommit,
  CommitType,
  ICursor,
  DataWithCursor,
  EntityType,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface ICommitDocument extends Omit<
ICommit,
'_id' | 'projectBranch' | 'mergeFromBranch' | 'mergeFromCommit' | 'parentCommit' | 'entityCommits' | 'workspace' | 'project'>,
  Document {

  _id: ObjectId

  workspace: ObjectId

  project: ObjectId

  projectBranch: ObjectId

  mergeFromBranch?: ObjectId | string

  mergeFromCommit?: ObjectId

  parentCommit?: ObjectId

  entityCommits: ObjectId[]

  toObject(): ICommitDocument
  toJSON(): ICommit
}

export interface ICommitModel extends Model<ICommitDocument> {
  createCommit(payload: object): Promise<ICommitDocument>

  findCommitById(
    id: string | ObjectId,
    projectBranchId?: string | ObjectId
  ): Promise<ICommitDocument | undefined>

  findCommitByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId,
  ): Promise<ICommitDocument | undefined>

  findCommits(
    filter: {
      project: string | ObjectId,
      workspace: string | ObjectId,
      after?: string,
      projectBranch: string | ObjectId,
      entityType?: EntityType
      entity?: string | ObjectId,
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<ICommitDocument>>

  getLastCommitInBranch(
    projectBranchId: string | ObjectId,
    timeFilter?: {
      before?: string | ObjectId
      after?: string | ObjectId
    }
  ): Promise<ICommitDocument | undefined>

  updateCommitById(
    id: string | ObjectId,
    payload: object
  ): Promise<ICommitDocument | undefined>

  getMergeCommit(
    projectBranchId: string | ObjectId,
    fromProjectBranchId: string | ObjectId,
  ): Promise<ICommitDocument>

  deleteCommitById(id: string | ObjectId, projectBranchId?: string | ObjectId): Promise<void>
  deleteCommitsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteCommitsByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  getCommitsInProjectCursor(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): any

  deleteCommitsByProjectBranch(
    projectBranchId: string | ObjectId,
  ): Promise<void>
}

const CommitSchema = new Schema({
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
    index: true,
  },
  parentCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  entityCommits: [{
    type: ObjectId,
    ref: 'Entity-Commit',
  }],
  mergeFromBranch: {
    type: ObjectId,
    ref: 'Branch',
  },
  mergeFromCommit: {
    type: ObjectId,
    ref: 'Commit',
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(CommitType),
  },
  workspaceUsers: [{
    type: ObjectId,
    ref: 'Workspace-User',
  }],
}, {
  timestamps: true,
})

CommitSchema.statics.createCommit = async function (payload: object) {
  const commit = await new this(payload).save()

  return commit.populate([{
    path: 'entityCommits',
    model: 'Entity-Commit',
    populate: {
      path: 'entity',
      model: 'Entity',
      foreignField: 'entityId',
    },
  }])
}

CommitSchema.statics.findCommitById = function (
  id: string | ObjectId,
  projectBranchId?: string | ObjectId,
) {
  const conditions: any = {
    _id: id,
  }

  if (projectBranchId) {
    conditions.projectBranch = new ObjectId(projectBranchId)
  }

  return this.findOne(conditions).populate('entityCommits')
}

CommitSchema.statics.findCommitByIdAndProjectAndWorkspace = function (
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

CommitSchema.statics.findCommits = async function (
  filter: {
    project: string | ObjectId,
    workspace: string | ObjectId,
    after?: string,
    projectBranch: string | ObjectId,
    entityType?: EntityType
    entity?: string | ObjectId,
  },
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {
    projectBranch: new ObjectId(filter.projectBranch),
  }

  if (filter.after) {
    conditions.createdAt = { $gte: new Date(filter.after) }
  }


  if (filter.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }


  if (filter.project) {
    conditions.project = new ObjectId(filter.project)
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

CommitSchema.statics.getLastCommitInBranch = function (
  projectBranchId: string | ObjectId,
  timeFilter?: {
    before?: string | ObjectId
    after?: string | ObjectId
  },
) {
  const conditions: any = {
    projectBranch: new ObjectId(projectBranchId),
  }

  if (timeFilter?.before) {
    conditions._id = {
      $lte: new ObjectId(timeFilter.before),
    }
  }

  if (timeFilter?.after) {
    conditions._id = {
      ...(conditions?._id || {}),
      $gte: new ObjectId(timeFilter.after),
    }
  }

  return this.findOne(conditions).sort({
    _id: -1,
  })
}

CommitSchema.statics.updateCommitById = function (
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
  ).populate('entityCommits')
}

CommitSchema.statics.getMergeCommit = async function (
  projectBranchId: string | ObjectId,
  fromProjectBranchId: string | ObjectId,
) {
  return this.findOne({
    projectBranch: projectBranchId,
    mergeFromBranch: fromProjectBranchId,
  })
}


CommitSchema.statics.deleteCommitById = function (id: string | ObjectId, projectBranchId?: string | ObjectId) {
  const conditions: any = {
    _id: id,
  }

  if (projectBranchId) {
    conditions.projectBranch = new ObjectId(projectBranchId)
  }

  return this.deleteOne(conditions)
}

CommitSchema.statics.getCommitsInProjectCursor = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
    project: projectId,
  }).sort({ _id: 1 }).cursor()
}

CommitSchema.statics.deleteCommitsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

CommitSchema.statics.deleteCommitsByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

CommitSchema.statics.deleteCommitsByProjectBranch = function (
  projectBranchId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    projectBranch: projectBranchId,
  })
}
CommitSchema.index(
  {
    workspace: 1,
    project: 1,
  },
)

export const CommitModel = mongoose.model<ICommitDocument, ICommitModel>('Commit', CommitSchema)
