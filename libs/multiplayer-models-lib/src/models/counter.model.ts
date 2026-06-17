import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'

const { Schema } = mongoose

export interface ICounterDocument extends Document {
  _id: ObjectId

  seq: number

  toObject(): ICounterDocument
}

export interface ICounterModel extends Model<ICounterDocument> {
  getNextSequenceValue(counterId: string): Promise<number>
}

const CounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: false,
})

CounterSchema.statics.getNextSequenceValue = async function (counterId: string) {
  const counter = await this.findOneAndUpdate(
    {
      _id: counterId,
    },
    {
      $inc: {
        seq: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )

  return counter?.seq || 10000
}

export const CounterModel = mongoose.model<ICounterDocument, ICounterModel>('Counter', CounterSchema)
