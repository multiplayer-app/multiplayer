import crypto from 'crypto'
import { Model } from 'mongoose'
import { mongoose, ObjectId } from '@multiplayer/mongo'
import {
  IToken,
  OauthTokenType,
  TokenTypeEnum,
} from '@multiplayer/types'

const { Schema } = mongoose

export interface ITokenDocument extends Omit<IToken, '_id'>, Document {
  _id: ObjectId
  expiresAt: Date
  toObject(): ITokenDocument
}

export interface CreateTokensPayload {
  type: TokenTypeEnum
  user?: string | ObjectId
  meta?: {
    domain?: string
    workspace?: string | ObjectId
    workspaceUser?: string | ObjectId
    inviterWorkspaceUser?: string | ObjectId
  }
}

export interface ITokenModel extends Model<ITokenDocument> {
  createTokens(payloads: CreateTokensPayload[]): Promise<ITokenDocument[]>

  createToken(
    type: TokenTypeEnum,
    userId?: string | ObjectId,
    payload?: any
  ): Promise<ITokenDocument>

  findByToken(
    token: string,
    type?: TokenTypeEnum
  ): Promise<ITokenDocument | undefined>

  deleteByToken(
    token: string,
    type?: TokenTypeEnum
  ): Promise<ITokenDocument | undefined>

  deleteTokensByClientId(clientId: string): Promise<void>

  findByTokenTypeAndUser(
    type: TokenTypeEnum,
    userId?: string | ObjectId,
  ): Promise<ITokenDocument | undefined>

  deleteAllTokensForUser(
    userId: string | ObjectId,
    type: TokenTypeEnum,
    metaFilter?: { workspace?: string | ObjectId },
  ): Promise<void>

  deleteAllTokensForWorkspace(
    workspaceId: string | ObjectId,
    type: TokenTypeEnum,
    domain?: string,
  ): Promise<void>
}

const tokenSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  type: {
    type: String,
    require: true,
    enum: Object.values(TokenTypeEnum),
  },
  meta: {
    domain: {
      type: String,
    },
    workspace: {
      type: ObjectId,
      ref: 'Workspace',
    },
    workspaceUser: {
      type: ObjectId,
      ref: 'Workspace-User',
    },
    inviterWorkspaceUser: {
      type: ObjectId,
      ref: 'Workspace-User',
    },
    project: {
      type: ObjectId,
      ref: 'Project',
    },
    scopes: {
      type: [String],
    },
    clientId: {
      type: String,
    },
    oauthTokenType: {
      type: String,
      enum: Object.values(OauthTokenType),
    },
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

tokenSchema.statics.createTokens = function (
  payloads: CreateTokensPayload[],
) {
  return this.insertMany(payloads)
}

tokenSchema.statics.createToken = function (
  type: TokenTypeEnum,
  userId: string | ObjectId,
  payload?: Partial<IToken>,
) {
  const _payload = { ...payload }

  if (!_payload.token) {
    if (type === TokenTypeEnum.VERIFY_DOMAIN) {
      _payload.token = crypto.randomInt(0, 10000).toString().padStart(4, '0')
    } else {
      _payload.token = crypto.randomBytes(20).toString('hex')
    }
  }

  return new this({
    ...(_payload || {}),
    user: userId,
    type,
  }).save()
}

tokenSchema.statics.findByToken = function (
  token: string,
  type?: TokenTypeEnum,
) {
  const query: any = { token }
  if (type) {
    query.type = type
  }
  return this.findOne(query)
}

tokenSchema.statics.deleteByToken = function (
  token: string,
  type?: TokenTypeEnum,
) {
  const query: any = { token }
  if (type) {
    query.type = type
  }
  return this.findOneAndDelete(query)
}

tokenSchema.statics.deleteTokensByClientId = function (clientId: string) {
  return this.deleteMany({ 'meta.clientId': clientId })
}

tokenSchema.statics.findByTokenTypeAndUser = function (
  type: TokenTypeEnum,
  userId?: string | ObjectId,
): Promise<ITokenDocument | undefined> {
  return this.findOne({
    type,
    user: userId,
  })
}

tokenSchema.statics.deleteAllTokensForUser = function (
  userId: string | ObjectId,
  type: TokenTypeEnum,
  metaFilter?: { workspace?: string | ObjectId },
) {
  const filter: any = {
    user: userId,
    type,
  }

  if (metaFilter?.workspace) {
    filter['meta.workspace'] = metaFilter.workspace
  }

  return this.deleteMany(filter)
}

tokenSchema.statics.deleteAllTokensForWorkspace = function (
  workspaceId: string | ObjectId,
  type: TokenTypeEnum,
  domain?: string,
) {
  const filter = {
    'meta.workspace': workspaceId,
    type,
  }

  if (domain) {
    filter['meta.domain'] = domain
  }

  return this.deleteMany(filter)
}

tokenSchema.index({
  createdAt: 1,
}, {
  expireAfterSeconds: 1800,
  partialFilterExpression: {
    type: {
      $in: [
        TokenTypeEnum.CONFIRM_EMAIL,
        TokenTypeEnum.RESET_PASSWORD,
        TokenTypeEnum.VERIFY_DOMAIN,
      ],
    },
  },
})

tokenSchema.index({
  expiresAt: 1,
}, {
  expireAfterSeconds: 0,
})

export const TokenModel = mongoose.model<ITokenDocument, ITokenModel>('Token', tokenSchema)
