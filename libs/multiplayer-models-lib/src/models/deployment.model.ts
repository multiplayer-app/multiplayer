import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IDeployment,
  ICursor,
  DataWithCursor,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IDeploymentDocument extends Omit<IDeployment, '_id' | 'entity' | 'release'>, Document {
  _id: ObjectId

  entity: ObjectId | string

  release: ObjectId | string

  toObject(): IDeploymentDocument
  toJSON(): IDeployment
}

export interface IDeploymentModel extends Model<IDeploymentDocument> {
  createDeployment(
    payload: Partial<IDeploymentDocument>
  ): Promise<IDeploymentDocument>

  findDeploymentById(
    id: string | ObjectId
  ): Promise<IDeploymentDocument | undefined>

  findDeploymentByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IDeploymentDocument | undefined>

  findDeployments(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      entity?: string | ObjectId,
      environment?: string | ObjectId,
    },
    cursor?: ICursor,
    sort?: {
      sortKey: string,
      sortDirection: -1 | 1,
    },
  ): Promise<DataWithCursor<IDeploymentDocument>>

  getDeploymentsInWorkspaceCursor(
    workspaceId: string | ObjectId,
  ): any

  deleteDeploymentsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>
}

const DeploymentSchema = new Schema({
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
  entity: {
    type: ObjectId,
    ref: 'Entities',
    required: true,
  },
  release: {
    type: ObjectId,
    ref: 'Releases',
    required: true,
  },
  environment: {
    type: ObjectId,
    ref: 'Entities',
    required: true,
  },
}, {
  timestamps: true,
})

DeploymentSchema.statics.createDeployment = function (
  payload: Partial<IDeployment>,
) {
  return new this(payload).save()
}

DeploymentSchema.statics.findDeploymentById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

DeploymentSchema.statics.findDeploymentByIdAndProjectAndWorkspace = function (
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

DeploymentSchema.statics.findDeployments = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    entity?: string | ObjectId,
    environment?: string | ObjectId,
  },
  cursor?: ICursor,
  sort?: {
    sortKey: string,
    sortDirection: -1 | 1,
  },
) {
  const cursorOptions = {
    skip: cursor?.skip || SKIP,
    limit: cursor?.limit || LIMIT,
  }

  const conditions: any = {
    workspace: new ObjectId(filter.workspace),
    project: new ObjectId(filter.project),
  }

  if (filter.entity) {
    conditions.entity = new ObjectId(filter.entity)
  }

  if (filter.environment) {
    conditions.environment = new ObjectId(filter.environment)
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: conditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          ...sort
            ? [{ $sort: { [sort.sortKey]: sort.sortDirection } }]
            : [],
          { $skip: cursorOptions.skip },
          { $limit: cursorOptions.limit },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursorOptions.skip,
      limit: cursorOptions.limit,
    },
  }
}

DeploymentSchema.statics.getDeploymentsInWorkspaceCursor = function (
  workspaceId: string | ObjectId,
): any {
  return this.find({
    workspace: workspaceId,
  }).sort({ _id: 1 }).cursor()
}

DeploymentSchema.statics.deleteDeploymentsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

// DeploymentSchema.index({
//   workspace: 1,
//   project: 1,
//   entity: 1,
//   release: 1,
//   environment: 1,
// }, {
//   unique: true,
// })

DeploymentSchema.index({
  workspace: 1,
  project: 1,
  entity: 1,
})

export const DeploymentModel = mongoose.model<IDeploymentDocument, IDeploymentModel>('Deployment', DeploymentSchema)
