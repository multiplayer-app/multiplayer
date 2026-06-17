import { mongoose, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { Username } from '@multiplayer/util-shared'
import { Model } from 'mongoose'
import bcrypt from 'bcrypt'
import {
  IUser,
  ICursor,
  UserPrimaryEmailSourceEnum,
  WorkspaceUserStatus,
  IUserSession,
} from '@multiplayer/types'
import { CounterModel } from './counter.model'
import { IWorkspaceUserDocument } from './workspace-user.model'
import { SALT_ROUNDS } from '../config'

const { Schema } = mongoose

export interface IUserDocument extends Omit<IUser, '_id' | 'workspaceUser'>, Document {
  _id: ObjectId

  verifyLocalPassword(candidatePassword: string): Promise<boolean>

  setLocalPassword(password: string): Promise<void>

  isWithoutProfile(): boolean

  workspaceUser: IWorkspaceUserDocument & { hasAccessToWorkspace: boolean }

  toObject(): IUserDocument
}

export interface IUserModel extends Model<IUserDocument> {
  createByGitlabProfile(
    email: string,
    gitlabId: string,
    payload?: Partial<IUser>
  ): Promise<IUserDocument>

  createByGithubProfile(
    email: string,
    githubId: string,
    payload?: Partial<IUser>
  ): Promise<IUserDocument>

  createByGoogleProfile(
    email: string,
    googleId: string,
    payload?: Partial<IUser>
  ): Promise<IUserDocument>

  createByLocalEmail(
    email: string,
    password?: string,
    payload?: Partial<IUser>
  ): Promise<IUserDocument>

  createWithoutProfile(
    email: string,
    payload?: Partial<IUser>
  ): Promise<IUserDocument>

  findByGitlabId(
    gitlabId: string
  ): Promise<IUserDocument | undefined>

  findByGithubId(
    githubId: string
  ): Promise<IUserDocument | undefined>

  findByGoogleId(
    googleId: string
  ): Promise<IUserDocument | undefined>

  findByAnyEmail(
    email: string
  ): Promise<IUserDocument | undefined>

  findByPrimaryEmail(
    email: string
  ): Promise<IUserDocument>

  findByPrimaryEmails(
    emails: Array<string>
  ): Promise<Array<IUserDocument>>

  findByPrimaryEmailsWithWorkspaceUser(
    emails: Array<string>,
    workspaceId: string | ObjectId
  ): Promise<Array<IUserDocument>>

  findByLocalEmail(
    email: string
  ): Promise<IUserDocument | undefined>

  findUserById(
    id: string | ObjectId
  ): Promise<IUserDocument | undefined>

  findUsersByIds(
    ids: Array<string | ObjectId>
  ): Promise<Array<IUserDocument>>

  getUserSession(
    ids: Array<string | ObjectId>,
    workspaceIds?: Array<string | ObjectId>
  ): Promise<IUserSession[]>

  findUsers(
    filters?: IUser,
    cursor?: ICursor
  ): Promise<Array<IUserDocument>>

  updateUserById(
    id: string | ObjectId,
    payload: Partial<IUser>
  ): Promise<IUserDocument | undefined>

  confirmLocalEmail(
    id: string | ObjectId
  ): Promise<IUserDocument | undefined>

  addGoogleProfile(
    id: string | ObjectId,
    email: string,
    googleId: string
  ): Promise<IUserDocument | undefined>

  addGithubProfile(
    id: string | ObjectId,
    email: string,
    githubId: string
  ): Promise<IUserDocument | undefined>

  addGitlabProfile(
    id: string | ObjectId,
    email: string,
    gitlabId: string
  ): Promise<IUserDocument | undefined>

  addLocalProfile(
    id: string | ObjectId,
    email: string,
    password: string,
    isEmailConfirmed?: boolean,
  ): Promise<IUserDocument | undefined>

  removeGoogleProfile(
    id: string | ObjectId,
  ): Promise<IUserDocument | undefined>

  removeGithubProfile(
    id: string | ObjectId,
  ): Promise<IUserDocument | undefined>

  removeGitlabProfile(
    id: string | ObjectId,
  ): Promise<IUserDocument | undefined>

  deleteUserByIds(
    ids: Array<string | ObjectId>
  ): Promise<void>
}

const UserSchema = new Schema({
  superAdmin: {
    type: Boolean,
  },
  invite: {
    refUser: {
      type: ObjectId,
      ref: 'User',
    },
    queueNumber: {
      type: Number,
    },
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  primaryEmail: {
    type: String,
    require: true,
    index: true,
    unique: true,
  },
  primaryEmailSource: {
    type: String,
    enum: Object.keys(UserPrimaryEmailSourceEnum),
  },
  profiles: {
    gitlab: {
      id: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
      },
      email: {
        type: String,
        index: true,
      },
    },
    github: {
      id: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
      },
      email: {
        type: String,
        index: true,
      },
    },
    google: {
      id: {
        type: String,
        index: true,
        unique: true,
        sparse: true,
      },
      email: {
        type: String,
        index: true,
      },
    },
    local: {
      email: {
        type: String,
        index: true,
      },
      passwordHash: {
        type: String,
      },
      isEmailConfirmed: {
        type: Boolean,
      },
    },
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
  },
}, {
  timestamps: true,
})

UserSchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    if (ret?.profiles?.local?.passwordHash) {
      delete ret?.profiles?.local?.passwordHash
    }

    return ret
  },
})

UserSchema.statics.createByGitlabProfile = async function (
  email: string,
  gitlabId: string,
  payload?: Partial<IUser>,
) {
  const _email = email.toLowerCase()
  const _payload = {
    ...(payload || {}),
  }

  const queueNumber = await CounterModel.getNextSequenceValue('User-Counter')
  const userPayload = {
    primaryEmail: _email,
    primaryEmailSource: UserPrimaryEmailSourceEnum.GITLAB,
    profiles: {
      gitlab: {
        id: gitlabId,
        email: _email,
      },
    },
    invite: {},
    ..._payload,
  }
  userPayload.invite.queueNumber = queueNumber

  const user = await new this(userPayload).save()

  return user
}

UserSchema.statics.createByGithubProfile = async function (
  email: string,
  githubId: string,
  payload?: Partial<IUser>,
) {
  const _email = email.toLowerCase()
  const _payload = {
    ...(payload || {}),
  }

  if (!_payload.firstName || !_payload.lastName) {
    const { firstName, lastName } = Username.getFirstLastNameFromEmail(_email)

    _payload.firstName = _payload.firstName || firstName
    _payload.lastName = _payload.lastName || lastName
  }

  const queueNumber = await CounterModel.getNextSequenceValue('User-Counter')
  const userPayload = {
    primaryEmail: _email,
    primaryEmailSource: UserPrimaryEmailSourceEnum.GITHUB,
    profiles: {
      github: {
        id: githubId,
        email: _email,
      },
    },
    invite: {},
    ..._payload,
  }
  userPayload.invite.queueNumber = queueNumber

  const user = await new this(userPayload).save()

  return user
}

UserSchema.statics.createByGoogleProfile = async function (
  email: string,
  googleId: string,
  payload?: Partial<IUser>,
) {
  const _email = email.toLowerCase()
  const _payload = {
    ...(payload || {}),
  }

  if (!_payload.firstName || !_payload.lastName) {
    const { firstName, lastName } = Username.getFirstLastNameFromEmail(_email)

    _payload.firstName = _payload.firstName || firstName
    _payload.lastName = _payload.lastName || lastName
  }

  const queueNumber = await CounterModel.getNextSequenceValue('User-Counter')
  const userPayload = {
    primaryEmail: _email,
    primaryEmailSource: UserPrimaryEmailSourceEnum.GOOGLE,
    profiles: {
      google: {
        id: googleId,
        email: _email,
      },
    },
    invite: {},
    ..._payload,
  }
  userPayload.invite.queueNumber = queueNumber

  const user = await new this(userPayload).save()

  return user
}

UserSchema.statics.createByLocalEmail = async function (
  email: string,
  password?: string,
  payload?: Partial<IUser>,
) {
  const _email = email.toLowerCase()
  let passwordHash

  if (password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  }

  const _payload = {
    ...(payload || {}),
  }

  if (!_payload.firstName || !_payload.lastName) {
    const { firstName, lastName } = Username.getFirstLastNameFromEmail(_email)

    _payload.firstName = _payload.firstName || firstName
    _payload.lastName = _payload.lastName || lastName
  }

  const queueNumber = await CounterModel.getNextSequenceValue('User-Counter')
  const userPayload = {
    primaryEmail: _email,
    primaryEmailSource: UserPrimaryEmailSourceEnum.LOCAL,
    profiles: {
      local: {
        email: _email,
        passwordHash,
        isEmailConfirmed: false,
      },
    },
    invite: {},
    ..._payload,
  }
  userPayload.invite.queueNumber = queueNumber

  const user = await new this(userPayload).save()


  return user
}

UserSchema.statics.createWithoutProfile = async function (
  email: string,
  payload?: Partial<IUser>,
) {
  const _email = email.toLowerCase()
  const _payload = {
    ...(payload || {}),
  }

  if (!_payload.firstName || !_payload.lastName) {
    const { firstName, lastName } = Username.getFirstLastNameFromEmail(_email)

    _payload.firstName = _payload.firstName || firstName
    _payload.lastName = _payload.lastName || lastName
  }

  const queueNumber = await CounterModel.getNextSequenceValue('User-Counter')
  const userPayload = {
    primaryEmail: _email,
    invite: {},
    ..._payload,
    profiles: {},
  }
  userPayload.invite.queueNumber = queueNumber

  if (payload?.profiles?.local?.isEmailConfirmed) {
    userPayload.profiles = {
      local: {
        isEmailConfirmed: payload?.profiles?.local?.isEmailConfirmed,
      },
    }
  }

  const user = await new this(userPayload).save()

  return user
}

UserSchema.statics.findByGitlabId = function (gitlabId: string) {
  return this.findOne({ 'profiles.gitlab.id': gitlabId })
}
UserSchema.statics.findByGithubId = function (githubId: string) {
  return this.findOne({ 'profiles.github.id': githubId })
}
UserSchema.statics.findByGoogleId = function (googleId: string) {
  return this.findOne({ 'profiles.google.id': googleId })
}

UserSchema.statics.findByAnyEmail = function (email: string) {
  const _email = email.toLowerCase()

  return this.findOne({
    $or: [{
      primaryEmail: _email,
    }, {
      'profiles.github.email': _email,
    }, {
      'profiles.google.email': _email,
    }, {
      'profiles.gitlab.email': _email,
    }, {
      'profiles.local.email': _email,
    }],
  })
}

UserSchema.statics.findByPrimaryEmail = function (
  email: string,
) {
  const _email = email.toLowerCase()

  return this.findOne({
    primaryEmail: _email,
  })
}

UserSchema.statics.findByPrimaryEmails = function (
  emails: Array<string>,
) {
  const _emails = emails.map(email => email.toLowerCase())

  return this.find({
    primaryEmail: {
      $in: _emails,
    },
  })
}

UserSchema.statics.findByPrimaryEmailsWithWorkspaceUser = function (
  emails: Array<string>,
  workspaceId: string | ObjectId,
) {
  const _emails = emails.map(email => email.toLowerCase())

  const pipeline = [{
    $match: {
      primaryEmail: {
        $in: _emails,
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: '_id',
      foreignField: 'user',
      as: 'workspaceUser',
      pipeline: [{
        $match: {
          $expr: {
            $eq: ['$workspace', new ObjectId(workspaceId)],
          },
        },
      }],
    },
  }, {
    $unwind: {
      path: '$workspaceUser',
      preserveNullAndEmptyArrays: true,
    },
  }, {
    $lookup: {
      from: 'workspaces',
      localField: 'workspaceUser.workspace',
      foreignField: '_id',
      as: 'workspace',
      let: {
        workspaceUserId: '$workspaceUser._id',
      },
      pipeline: [{
        $match: {
          $expr: {
            in: ['$users.workspaceUser', '$$workspaceUserId'],
          },
        },
      }],
    },
  }, {
    $unwind: {
      path: '$workspace',
      preserveNullAndEmptyArrays: true,
    },
  }, {
    $addFields: {
      'workspaceUser.hasAccessToWorkspace': {
        $cond: [
          {
            $and: [
              { $eq: ['workspaceUser.status', WorkspaceUserStatus.ACTIVE] },
              { $gt: ['$workspace._id', null] },
            ],
          },
          true,
          false,
        ],
      },
    },
  }, {
    $unset: ['workspace'],
  }]

  return this.aggregate(pipeline)
}

UserSchema.statics.findByLocalEmail = function (
  email: string,
) {
  const _email = email.toLowerCase()

  return this.findOne({
    'profiles.local.email': _email,
  })
}

UserSchema.statics.findUserById = function (
  id: string | ObjectId,
) {
  return this.findById(id)
}

UserSchema.statics.findUsersByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.find({
    _id: {
      $in: ids,
    },
  })
}

UserSchema.statics.getUserSession = function (
  ids: string[] | ObjectId[],
  workspaceIds?: string[] | ObjectId[],
) {
  const pipeline = [{
    $match: {
      _id: {
        $in: ids.map(id => new ObjectId(id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: '_id',
      foreignField: 'user',
      as: 'workspaceUsers',
      pipeline: [{
        $match: {
          $and: [{
            $expr: {
              $eq: ['$status', WorkspaceUserStatus.ACTIVE],
            },
          },
          ...workspaceIds?.length
            ? [{
              $expr: {
                $in: [
                  '$workspace',
                  workspaceIds.map(workspaceId => new ObjectId(workspaceId)),
                ],
              },
            }]
            : [],
          ],
        },
      }, {
        $project: {
          _id: 1,
          workspace: 1,
        },
      }],
    },
  }, {
    $lookup: {
      from: 'workspaces',
      localField: 'workspaceUsers._id',
      foreignField: 'users.workspaceUser',
      as: 'workspaces',
      pipeline: [{
        $project: {
          _id: 1,
          users: 1,
          name: 1,
          iconUrl: 1,
          handle: 1,
        },
      }],
    },
  }, {
    $unwind: {
      path: '$workspaces',
      preserveNullAndEmptyArrays: true,
    },
  }, {
    $project: {
      _id: 1,
      enabled: 1,
      superAdmin: 1,
      firstName: 1,
      lastName: 1,
      primaryEmail: 1,
      primaryEmailSource: 1,
      workspaceUsers: 1,
      workspaces: {
        _id: 1,
        name: 1,
        iconUrl: 1,
        handle: 1,
        user: {
          $first: {
            $filter: {
              input: '$workspaces.users',
              as: 'user',
              cond: {
                $in: [
                  '$$user.workspaceUser',
                  '$workspaceUsers._id',
                ],
              },
            },
          },
        },
      },
    },
  }, {
    $lookup: {
      from: 'roles',
      localField: 'workspaces.user.role',
      foreignField: '_id',
      as: 'workspaces.user.roleObject',
      pipeline: [{
        $project: {
          _id: 1,
          workspaceOwner: 1,
          workspaceAdmin: 1,
        },
      }],
    },
  }, {
    $unwind: {
      path: '$workspaces.user.roleObject',
      preserveNullAndEmptyArrays: true,
    },
  }, {
    $lookup: {
      from: 'teams',
      localField: 'workspaces._id',
      foreignField: 'workspace',
      as: 'workspaces.teams',
      let: {
        workspaceUserId: '$workspaces.user.workspaceUser',
      },
      pipeline: [{
        $match: {
          $expr: {
            $ne: ['$archived', true],
          },
        },
      }, {
        $project: {
          _id: 1,
          projects: 1,
          user: {
            $first: {
              $filter: {
                input: '$users',
                as: 'user',
                cond: {
                  $eq: [
                    '$$workspaceUserId',
                    '$$user.workspaceUser',
                  ],
                },
              },
            },
          },
        },
      }, {
        $project: {
          _id: 1,
          projects: 1,
          role: '$user.role',
        },
      }, {
        $match: {
          role: { $exists: true },
        },
      }],
    },
  },
  {
    $project: {
      _id: 1,
      enabled: 1,
      superAdmin: 1,
      firstName: 1,
      lastName: 1,
      primaryEmail: 1,
      primaryEmailSource: 1,
      workspaces: {
        _id: 1,
        name: 1,
        iconUrl: 1,
        handle: 1,
        user: {
          workspaceUser: 1,
          role: 1,
          workspaceOwner: '$workspaces.user.roleObject.workspaceOwner',
          workspaceAdmin: '$workspaces.user.roleObject.workspaceAdmin',
        },
        teams: 1,

      },
    },
  }, {
    $match: {
      'workspaces.user': { $exists: true },
    },
  }, {
    $lookup: {
      from: 'projects',
      as: 'workspaces.projects',
      // localField: 'workspaces.user.workspaceUser',
      // foreignField: 'users.workspaceUser',
      let: {
        workspaceUserId: '$workspaces.user.workspaceUser',
        workspaceId: '$workspaces._id',
        workspaceAdmin: { $ifNull: ['$workspaces.user.workspaceAdmin', false] },
        workspaceOwner: { $ifNull: ['$workspaces.user.workspaceOwner', false] },
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [
              {
                $or: [
                  {
                    $eq: ['$$workspaceAdmin', true],
                  },
                  {
                    $eq: ['$$workspaceOwner', true],
                  },
                  {
                    $in: ['$$workspaceUserId', { $ifNull: ['$users.workspaceUser', []] }],
                  },
                ],
              },
              {
                $eq: ['$workspace', '$$workspaceId'],
              },
            ],
          },
        },
      }, {
        $project: {
          _id: 1,
          name: 1,
          iconUrl: 1,
          user: {
            $first: {
              $filter: {
                input: '$users',
                as: 'user',
                cond: {
                  $eq: [
                    '$$workspaceUserId',
                    '$$user.workspaceUser',
                  ],
                },
              },
            },
          },
        },
      }, {
        $project: {
          _id: 1,
          name: 1,
          iconUrl: 1,
          role: '$user.role',
        },
      }],
    },
  }, {
    $group: {
      _id: '$_id',
      superAdmin: { $first: '$superAdmin' },
      enabled: { $first: '$enabled' },
      firstName: { $first: '$firstName' },
      lastName: { $first: '$lastName' },
      primaryEmail: { $first: '$primaryEmail' },
      primaryEmailSource: { $first: '$primaryEmailSource' },
      workspaces: { $push: '$workspaces' },
    },
  }, {
    $project: {
      _id: 1,
      superAdmin: 1,
      enabled: 1,
      firstName: 1,
      lastName: 1,
      primaryEmail: 1,
      primaryEmailSource: 1,
      workspaces: {
        $filter: {
          input: '$workspaces',
          as: 'workspace',
          cond: {
            $ne: [
              { $type: '$$workspace._id' },
              'missing',
            ],
          },
        },
      },
    },
  }]

  return this.aggregate(pipeline)
}

UserSchema.statics.findUsers = async function (filters: object, cursor: ICursor = {}) {
  cursor.skip = cursor.skip || 0
  cursor.limit = cursor.limit || 30

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...filters,
      },
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
        ],
      },
    },
  ])

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

UserSchema.statics.updateUserById = function (
  id: string | ObjectId,
  payload: Partial<IUser>,
) {
  const _payload: any = MongoPayload.flattenObject(payload)

  return this.findOneAndUpdate({
    _id: id,
  }, {
    $set: _payload,
  }, {
    new: true,
    runValidators: true,
  })
}

UserSchema.methods.verifyLocalPassword = function (candidatePassword: string) {
  if (!candidatePassword || !this?.profiles?.local?.passwordHash) {
    return false
  }

  return bcrypt.compare(candidatePassword, this.profiles.local.passwordHash)
}

UserSchema.methods.setLocalPassword = async function (password: string) {
  this.profiles = this.profiles || {}
  this.profiles.local = this.profiles.local || {}

  if (password) {
    this.profiles.local.passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  } else {
    this.profiles.local.passwordHash = undefined
  }
  return this.save()
}

UserSchema.methods.isWithoutProfile = function () {
  return !(this.profiles?.local?.email
    || this.profiles?.gitlab?.id
    || this.profiles?.github?.id
    || this.profiles?.google?.id)
}

UserSchema.statics.confirmLocalEmail = function (id: string | ObjectId) {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        'profiles.local.isEmailConfirmed': true,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.addGoogleProfile = function (
  id: string | ObjectId,
  email: string,
  googleId: string,
) {
  const _email = email.toLowerCase()

  return this.findOneAndUpdate(
    {
      _id: id,
      'profiles.google.id': {
        $exists: false,
      },
    },
    {
      $set: {
        'profiles.google': {
          id: googleId,
          email: _email,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.addGithubProfile = function (
  id: string | ObjectId,
  email: string,
  githubId: string,
) {
  const _email = email.toLowerCase()

  return this.findOneAndUpdate(
    {
      _id: id,
      'profiles.github.id': { $exists: false },
    },
    {
      $set: {
        'profiles.github': {
          id: githubId,
          email: _email,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.addGitlabProfile = function (
  id: string | ObjectId,
  email: string,
  gitlabId: string,
) {
  const _email = email.toLowerCase()

  return this.findOneAndUpdate(
    {
      _id: id,
      'profiles.gitlab.id': { $exists: false },
    },
    {
      $set: {
        'profiles.gitlab': {
          id: gitlabId,
          email: _email,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.addLocalProfile = async function (
  id: string | ObjectId,
  email: string,
  password: string,
  isEmailConfirmed?: boolean,
) {
  const _email = email.toLowerCase()
  let passwordHash

  if (password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  }

  return this.findOneAndUpdate(
    {
      _id: id,
      'profiles.local.email': { $exists: false },
    },
    {
      $set: {
        'profiles.local': {
          email: _email,
          passwordHash,
          isEmailConfirmed: isEmailConfirmed || false,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.removeGoogleProfile = function (
  id: string | ObjectId,
): Promise<IUserDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
      primaryEmailSource: {
        $ne: UserPrimaryEmailSourceEnum.GOOGLE,
      },
    },
    {
      $unset: {
        'profiles.google': '',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.removeGithubProfile = function (
  id: string | ObjectId,
): Promise<IUserDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
      primaryEmailSource: {
        $ne: UserPrimaryEmailSourceEnum.GITHUB,
      },
    },
    {
      $unset: {
        'profiles.github': '',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

UserSchema.statics.removeGitlabProfile = function (
  id: string | ObjectId,
): Promise<IUserDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
      primaryEmailSource: {
        $ne: UserPrimaryEmailSourceEnum.GITLAB,
      },
    },
    {
      $unset: {
        'profiles.gitlab': '',
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}


UserSchema.statics.deleteUserByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

UserSchema.index({
  'invite.queueNumber': 1,
}, {
  unique: true,
})

export const UserModel = mongoose.model<IUserDocument, IUserModel>('User', UserSchema)
