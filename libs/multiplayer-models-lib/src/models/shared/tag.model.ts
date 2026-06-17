import { mongoose } from '@multiplayer/mongo'

const { Schema } = mongoose

export const TagSchema = new Schema({
  key: {
    type: String,
  },
  value: {
    type: String,
    required: true,
  },
}, {
  _id: false,
})
