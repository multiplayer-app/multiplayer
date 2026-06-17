import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'

const { Schema } = mongoose

export interface ISessionDocument extends Document {
  _id: ObjectId

  toObject(): ISessionDocument
}

export interface ISessionModel extends Model<any> {

}

const SessionSchema = new Schema({}, { strict: false })

SessionSchema.index({ 'session.users': 1 }, { sparse: true })

export const SessionModel = mongoose.model<ISessionDocument, ISessionModel>('Session', SessionSchema)
