import { mongoose } from '@multiplayer/mongo'

const { Schema } = mongoose

export const SessionRecordingOptionsSchema = new Schema({
  frontend: {
    screens: {
      type: Boolean,
    },
    traces: {
      type: Boolean,
    },
    logs: {
      type: Boolean,
    },
    logLevel: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
    },
    content: {
      type: Boolean,
    },
  },
  backend: {
    traces: {
      type: Boolean,
    },
    logs: {
      type: Boolean,
    },
    logLevel: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
    },
    content: {
      type: Boolean,
    },
  },
}, {
  _id: false,
})
