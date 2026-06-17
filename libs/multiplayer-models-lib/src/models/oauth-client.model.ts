import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { JwtToken, MongoPayload } from '@multiplayer/util'
import { IOauthClient } from '@multiplayer/types'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../config'

const { Schema } = mongoose

export interface IOauthClientDocument extends Omit<IOauthClient, '_id'>, Document {
  _id: ObjectId

  toObject(): IOauthClientDocument
  toJSON(): IOauthClient
}

export interface IOauthClientModel extends Model<IOauthClientDocument> {
  createOauthClient(
    payload: Omit<IOauthClient, '_id'|'createdAt'| 'updatedAt'> & { _id? : ObjectId, registrationToken: string, clientSecret: string },
  ): Promise<IOauthClientDocument>

  findOauthClientById(
    id: string | ObjectId
  ): Promise<IOauthClientDocument | undefined>

  updateOauthClientById(
    id: string | ObjectId,
    payload: Partial<Omit<IOauthClient, '_id'>> & { clientSecret: string }
  ): Promise<IOauthClientDocument | undefined>

  removeOauthClientById(
    id: string | ObjectId,
  ): Promise<void>
}

const OauthClientSchema = new Schema({
  redirectUris: [String],
  clientName: {
    type: String,
    required: true,
  },
  clientUri: {
    type: String,
  },
  logoUri: {
    type: String,
  },
  grantTypes: [String],
  responseTypes: [String],
  clientSecret: {
    type: String,
    select: false,
    required: true,
  },
  registrationToken: {
    type: String,
    select: false,
    required: true,
  },
  scope: {
    type: String,
    required: true,
  },
  clientSecretExpiresAt: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
})

OauthClientSchema.methods.verifyClientSecret = function (secret: string) {
  if (!secret || !this.clientSecret) {
    return false
  }

  return bcrypt.compare(secret, this.clientSecret)
}

OauthClientSchema.statics.createOauthClient = async function (payload: Omit<IOauthClient, '_id'> & { _id? : ObjectId, registrationToken: string, clientSecret: string }) {
  const clientSecret = await bcrypt.hash(payload.clientSecret, SALT_ROUNDS)
  return new this({
    ...payload,
    clientSecret,
  }).save()
}

OauthClientSchema.statics.findOauthClientById = function (
  id: string | ObjectId,
) {
  return this.findOne({ _id: id })
}

OauthClientSchema.statics.updateOauthClientById = async function (
  id: string | ObjectId,
  payload: Partial<Omit<IOauthClient, '_id'|'createdAt'| 'updatedAt'>> & { clientSecret: string },
) {
  const clientSecret = await bcrypt.hash(payload.clientSecret, SALT_ROUNDS)
  const _payload = MongoPayload.flattenObject({
    ...payload,
    clientSecret,
  })
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: set,
      $unset: unset,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

OauthClientSchema.statics.removeOauthClientById = function(
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}


export const OauthClientModel = mongoose.model<IOauthClientDocument, IOauthClientModel>('OauthClient', OauthClientSchema)
