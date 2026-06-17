import { mongoose } from '@multiplayer/mongo'
import {
  IntegrationTypeEnum,
  GitContentType,
} from '@multiplayer/types'

const { Schema } = mongoose

export const GitRefSchema = new Schema({
  repositoryType: {
    type: String,
    enum: Object.values(IntegrationTypeEnum),
  },
  repositoryId: {
    type: String,
  },
  repositoryName: {
    type: String,
  },
  repositoryOwner: {
    type: String,
  },
  branch: {
    type: String,
  },
  path: {
    type: String,
  },
  contentType: {
    type: String,
    enum: Object.values(GitContentType),
  },
}, {
  _id: false,
})
