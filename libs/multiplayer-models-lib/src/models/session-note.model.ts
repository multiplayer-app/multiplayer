import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { ISessionNote } from '@multiplayer/types'

const { Schema } = mongoose

export interface ISessionNoteDocument extends Omit<ISessionNote, '_id' | 'session' | 'workspace' | 'project'>, Document {
  _id: ObjectId
  session: ObjectId
  workspace: ObjectId
  project: ObjectId
  toJSON(): ISessionNote
  toObject(): ISessionNoteDocument
}

export interface ISessionNoteModel extends Model<ISessionNoteDocument> {
  createSessionNote(payload: Omit<ISessionNote, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISessionNoteDocument>

  findSessionNote(sessionId: string | ObjectId): Promise<ISessionNoteDocument | undefined>

  updateSessionNote(
    sessionId: string | ObjectId,
    payload: Partial<ISessionNote>,
  ): Promise<ISessionNote | undefined>

  deleteSessionNote(sessionId: string | ObjectId): Promise<void>
}

export const SessionNoteSchema = new Schema({
  session: {
    type: ObjectId,
    ref: 'Debug-Session',
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
  content: {
    type: String,
  },
  bucket: {
    type: String,
  },
  prefix: {
    type: String,
  },
}, {
  timestamps: true,
})

SessionNoteSchema.index({
  workspace: 1,
  project: 1,
  session: 1,
}, {
  unique: true,
})

// Implement static methods
SessionNoteSchema.statics.createSessionNote = function (payload: Omit<ISessionNote, '_id' | 'createdAt' | 'updatedAt'>) {
  return new this(payload).save()
}

SessionNoteSchema.statics.findSessionNote = function (sessionId: string | ObjectId) {
  return this.findOne({ session: sessionId })
}

SessionNoteSchema.statics.updateSessionNote = function (
  sessionId: string | ObjectId,
  payload: Partial<ISessionNote>,
) {
  return this.findOneAndUpdate(
    { session: sessionId },
    { $set: payload },
    { new: true, runValidators: true },
  )
}

SessionNoteSchema.statics.deleteSessionNote = function (sessionId: string | ObjectId) {
  return this.deleteOne({ session: sessionId })
}

export const SessionNoteModel = mongoose.model<ISessionNoteDocument, ISessionNoteModel>('Session-Note', SessionNoteSchema)
