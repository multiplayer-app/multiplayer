import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IEntity,
  EntityType,
  IEntityContent,
} from '@multiplayer/types'

const { Schema } = mongoose

export interface IEntityContentDocument extends Omit<IEntityContent, '_id' | 'entityId' | 'projectBranch' | 'project' | 'workspace'>, Document {
  _id: ObjectId
  entityId: ObjectId
  workspace: ObjectId
  project: ObjectId
  projectBranch: ObjectId
  toObject(): IEntity
  toJSON(): IEntity
}

export interface IEntityContentDocumentModel extends Model<IEntityContentDocument> {
  createEntityContent(
    payload: Omit<IEntityContent | IEntityContentDocument, '_id'>
  ): Promise<IEntityContentDocument>
  deleteEntityContentByEntityIdAndBranchId(entityId: string | ObjectId, branchId: string| ObjectId): Promise<void>
  getEntityContentByEntityIdAndBranchMap(entityId: string | ObjectId, branchIds: (string| ObjectId)[]): Promise<void>
  deleteEntityContentByWorkspace(workspace: string | ObjectId): Promise<void>
  deleteEntityContentByProject(workspace: string | ObjectId, project: string| ObjectId): Promise<void>
}

const EntityContentSchema = new Schema({
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
  data: {
    type: Object,
    required: true,
  },
}, {
  timestamps: true,
})

EntityContentSchema.statics.createEntityContent = function (
  payload: Omit<IEntityContent | IEntityContentDocument, '_id'>,
): Promise<IEntityContentDocument> {
  return this.findOneAndUpdate(
    {
      workspace: payload.workspace,
      project: payload.project,
      projectBranch: payload.projectBranch,
      entityId: payload.entityId,
    },
    payload,
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}
EntityContentSchema.statics.deleteEntityContentByEntityIdAndBranchId = function (
  entityId: string | ObjectId, branchId: string| ObjectId,
): Promise<void> {
  return this.deleteOne({
    entityId,
    projectBranch: branchId,
  })
}
EntityContentSchema.statics.deleteEntityContentByProject = function (
  workspace: string | ObjectId, project: string | ObjectId,
): Promise<void> {
  return this.deleteMany({ workspace, project })
}
EntityContentSchema.statics.deleteEntityContentByWorkspace = function (
  workspace: string | ObjectId,
): Promise<void> {
  return this.deleteMany({ workspace })
}
EntityContentSchema.statics.getEntityContentByEntityIdAndBranchMap = function (
  entityId: string | ObjectId, branchIds: (string| ObjectId)[],
): Promise<IEntityContentDocument | undefined> {
  return this.findOne({
    entityId,
    projectBranch: { $in: branchIds },
  }).sort({ projectBranch: -1 })
}

EntityContentSchema.index({
  entityId: 1,
  _id: -1,
  projectBranch: 1,
})

export const EntityContentModel = mongoose.model<IEntityContentDocument, IEntityContentDocumentModel>('Entity-Content', EntityContentSchema)
