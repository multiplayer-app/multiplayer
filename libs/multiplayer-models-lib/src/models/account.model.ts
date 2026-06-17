import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import { AccountType } from '@multiplayer/types'
import { IAccount, IAccess } from '@multiplayer/types'
import { AccessSchema } from './shared/access.model'

const { Schema } = mongoose

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export interface IAccountDocument extends Omit<IAccount, '_id'>, Document {
  _id: ObjectId

  toObject(): IAccountDocument
  toJSON(): IAccount
}

export interface IAccountModel extends Model<IAccountDocument> {
  createAccount(
    payload: object
  ): Promise<IAccountDocument>

  findAccountById(
    id: string | ObjectId
  ): Promise<IAccountDocument | undefined>

  findAccountsByOwnerId(
    ownerId: string | ObjectId
  ): Promise<IAccountDocument[]>

  findAccountByIdAndOwner(
    id: string | ObjectId,
    ownerId: string | ObjectId
  ): Promise<IAccountDocument | undefined>

  updateAccountById(
    id: string | ObjectId,
    payload: DeepPartial<IAccountDocument>
  ): Promise<IAccountDocument | undefined>

  removeAccountById(
    id: string | ObjectId,
  ): Promise<void>

  updateAccountAccess(
    id: string | ObjectId,
    payload: Partial<IAccess>
  ): Promise<IAccess | undefined>
}

const AccountSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(AccountType),
    required: true,
  },
  name: {
    type: String,
  },
  owner: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
  billing: {
    usedTrial: {
      type: Boolean,
    },
    stripe: {
      customerId: {
        type: String,
      },
    },
  },
  access: AccessSchema,
}, {
  timestamps: true,
})

AccountSchema.statics.createAccount = function (payload: object) {
  return new this(payload).save()
}

AccountSchema.statics.findAccountById = function (
  id: string | ObjectId,
) {
  return this.findOne({ _id: id })
}

AccountSchema.statics.findAccountByIdAndOwner = function (
  id: string | ObjectId,
  ownerId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    owner: ownerId,
  })
}

AccountSchema.statics.findAccountsByOwnerId = function (
  ownerId: string | ObjectId,
) {
  return this.find({ owner: ownerId })
}

AccountSchema.statics.updateAccountById = function (
  id: string | ObjectId,
  payload: Partial<IAccountDocument>,
) {
  const _payload = MongoPayload.flattenObject(payload)
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

AccountSchema.statics.removeAccountById = function(
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}


AccountSchema.statics.findAccountById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

AccountSchema.statics.updateAccountAccess = async function(
  id: string | ObjectId,
  payload: Partial<IAccess>,
): Promise<IAccess | undefined> {
  const _payload = MongoPayload.prependToKeys(MongoPayload.flattenObject(payload), 'access')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const { access } = await this.findOneAndUpdate(
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

  return access
}

export const AccountModel = mongoose.model<IAccountDocument, IAccountModel>('Account', AccountSchema)
