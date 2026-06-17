import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  ITeam,
  ITeamMember,
  DataWithCursor,
  ICursor,
  IProject,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface ITeamDocument extends Omit<ITeam, '_id'>, Document {
  _id: ObjectId

  toObject(): ITeamDocument
}

export interface ITeamModel extends Model<ITeamDocument> {
  createTeam(payload: object): Promise<ITeamDocument>

  countTeamsInWorkspace(workspaceId: string | ObjectId): Promise<number>

  findTeamById(
    id: string | ObjectId
  ): Promise<ITeamDocument | undefined>

  findTeamByIdAndWorkspace(
    id: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<ITeamDocument | undefined>

  findTeamByIds(
    ids: string[] | ObjectId[],
    filter?: {
      workspace: string | ObjectId
    },
  ): Promise<ITeamDocument[]>

  findTeams(
    workspaceId: string | ObjectId,
    filter: {
      _id?: ObjectId[] | string[]
      archived?: boolean
      workspaceUsers?: ObjectId[]
    },
    cursor?: ICursor
  ): Promise<DataWithCursor<ITeamDocument>>

  updateTeamById(
    id: string | ObjectId,
    payload: object
  ): Promise<ITeamDocument | undefined>

  deleteTeamById(id: string | ObjectId): Promise<void>

  listUsers(
    id: string | ObjectId,
    cursor?: ICursor
  ): Promise<DataWithCursor<ITeamMember>>

  getTeamMembersByWorkspaceUserIds(
    id: string | ObjectId,
    workspaceUsersIds: Array<string | ObjectId>,
  ): Promise<Array<ITeamMember>>

  getTeamMembersByTeamMemberIds(
    id: string | ObjectId,
    teamMemberIds: Array<string | ObjectId>,
  ): Promise<Array<ITeamMember>>

  addUsers(
    id: string | ObjectId,
    workspaceUserIds: Array<string | ObjectId>,
    role: string | ObjectId,
  ): Promise<Array<ITeamMember>>

  updateUser(
    id: string | ObjectId,
    teamMemberId: string | ObjectId,
    payload: object
  ): Promise<ITeamMember | undefined>

  removeUser(
    id: string | ObjectId,
    teamMemberId: string | ObjectId
  ): Promise<void>

  removeUserFromAllWorkspaceTeams(
    workspaceId: string | ObjectId,
    workspaceUserId: string | ObjectId,
  ): Promise<void>

  listProjects(
    teamId: string | ObjectId
  ): Promise<IProject>

  addProject(
    id: string | ObjectId,
    projectId: string | ObjectId | string[] | ObjectId[]
  ): Promise<IProject>

  removeProject(
    id: string | ObjectId,
    projectId: string | ObjectId
  ): Promise<void>

  removeProjectFromAllTeams(
    projectId: string | ObjectId
  ): Promise<void>

  getProjectIds(
    teamIds: string[] | ObjectId[],
  ): Promise<{ _id: ObjectId }[]>

  deleteTeamsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>
}

const TeamUserSchema = new Schema({
  workspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User',
    required: true,
  },
  role: {
    type: ObjectId,
    ref: 'Role',
    required: true,
  },
})

const TeamSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspaces',
    required: true,
  },
  projects: [{
    type: ObjectId,
    ref: 'Projects',
  }],
  users: [TeamUserSchema],
  archived: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  iconUrl: {
    type: String,
  },
}, {
  timestamps: true,
})

TeamSchema.statics.createTeam = function (payload: object) {
  return new this(payload).save()
}

TeamSchema.statics.countTeamsInWorkspace = function (
  workspaceId: string | ObjectId,
) {
  return this.countDocuments({
    workspace: workspaceId,
  })
}

TeamSchema.statics.findTeamById = function(id: string | ObjectId) {
  return this.findOne({ _id: id })
}

TeamSchema.statics.findTeamByIdAndWorkspace = function(
  id: string | ObjectId,
  workspaceId: string | ObjectId,
) {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
  })
}

TeamSchema.statics.findTeamByIds = function(
  ids: string[] | ObjectId[],
  filter?: {
    workspace: string | ObjectId
  },
): Promise<ITeamDocument[]> {
  const conditions: any = {}

  if (filter?.workspace) {
    conditions.workspace = new ObjectId(filter.workspace)
  }

  return this.find({
    _id: {
      $in: ids.map(id => new ObjectId(id)),
    },
    ...conditions,
  })
}

TeamSchema.statics.findTeams = async function (
  workspaceId: string | ObjectId,
  filter: {
    _id?: ObjectId[]
    archived: boolean
    workspaceUsers?: ObjectId[]
  },
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {}

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  if (filter.workspaceUsers) {
    conditions['users.workspaceUser'] = {
      $in: filter.workspaceUsers.map(id => new ObjectId(id)),
    }
  }

  if (filter._id) {
    conditions._id = {
      $in: filter._id.map(id => new ObjectId(id)),
    }
  }

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate([
    {
      $match: {
        ...conditions,
        workspace: new ObjectId(workspaceId),
      },
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          { $unset: 'users' },
          {
            $lookup: {
              from: 'projects',
              as: 'projects',
              let: { projectIds: '$projects' },
              pipeline: [{
                $match: {
                  $expr: {
                    $in: ['$_id', '$$projectIds'],
                  },
                },
              }, {
                $project: {
                  _id: 1,
                  name: 1,
                },
              }],
            },
          },
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

TeamSchema.statics.updateTeamById = function (id: string | ObjectId, payload: object) {
  const _payload = MongoPayload.flattenObject(payload)

  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: _payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

TeamSchema.statics.deleteTeamById = function (id: string | ObjectId) {
  return this.deleteOne({ _id: id })
}

TeamSchema.statics.listUsers = async function (
  id: string | ObjectId,
  cursor: ICursor = {},
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const pipeline = [{
    $match: {
      _id: new ObjectId(id),
    },
  }, {
    $unwind: '$users',
  },
  {
    $facet: {
      count: [{ $count: 'count' }],
      items: [
        { $skip: cursor.skip },
        { $limit: cursor.limit },
        {
          $lookup: {
            from: 'workspace-users',
            localField: 'users.workspaceUser',
            foreignField: '_id',
            as: 'users.workspaceUser',
          },
        }, {
          $unwind: '$users.workspaceUser',
        }, {
          $replaceRoot: {
            newRoot: '$users',
          },
        }, {
          $lookup: {
            from: 'users',
            localField: 'workspaceUser.user',
            foreignField: '_id',
            as: 'workspaceUser.user',
          },
        }, {
          $unwind: '$workspaceUser.user',
        }, {
          $set: {
            'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
          },
        }, {
          $unset: ['workspaceUser.user'],
        },
      ],
    },
  }]

  const [{ items, count: [{ count } = { count: 0 }] }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

TeamSchema.statics.getTeamMembersByWorkspaceUserIds = async function (
  id: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(id),
    },
  }, {
    $unwind: '$users',
  }, {
    $match: {
      'users.workspaceUser': {
        $in: workspaceUserIds.map(_id => new ObjectId(_id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: 'users.workspaceUser',
      foreignField: '_id',
      as: 'users.workspaceUser',
    },
  }, {
    $unwind: '$users.workspaceUser',
  }, {
    $replaceRoot: {
      newRoot: '$users',
    },
  }, {
    $lookup: {
      from: 'users',
      localField: 'workspaceUser.user',
      foreignField: '_id',
      as: 'workspaceUser.user',
    },
  }, {
    $unwind: '$workspaceUser.user',
  }, {
    $set: {
      'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
    },
  },
  // {
  //   $unset: ['workspaceUser.user'],
  // },
  ]

  const workspaceMembers = await this.aggregate(pipeline)

  return workspaceMembers
}


TeamSchema.statics.getTeamMembersByTeamMemberIds = async function (
  id: string | ObjectId,
  teamMemberIds: Array<string | ObjectId>,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(id),
    },
  }, {
    $unwind: '$users',
  }, {
    $match: {
      'users._id': {
        $in: teamMemberIds.map(_id => new ObjectId(_id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: 'users.workspaceUser',
      foreignField: '_id',
      as: 'users.workspaceUser',
    },
  }, {
    $unwind: '$users.workspaceUser',
  }, {
    $replaceRoot: {
      newRoot: '$users',
    },
  }, {
    $lookup: {
      from: 'users',
      localField: 'workspaceUser.user',
      foreignField: '_id',
      as: 'workspaceUser.user',
    },
  }, {
    $unwind: '$workspaceUser.user',
  }, {
    $set: {
      'workspaceUser.primaryEmail': '$workspaceUser.user.primaryEmail',
    },
  },
  // {
  //   $unset: ['workspaceUser.user'],
  // },
  ]

  const workspaceMembers = await this.aggregate(pipeline)

  return workspaceMembers
}

TeamSchema.statics.addUsers = async function (
  id: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
  role: string | ObjectId,
) {
  const filter = {
    _id: id,
    'users.workspaceUser': { $nin: workspaceUserIds },
  }
  const update = {
    $push: {
      users: {
        $each: workspaceUserIds.map((workspaceUserId) => ({
          workspaceUser: workspaceUserId,
          role,
        })),
      },
    },
  }
  const options = { new: true, runValidators: true }

  const team = await this.findOneAndUpdate(filter, update, options)

  const invitedTeamMembers = team.users
    .filter(({ workspaceUser }) => workspaceUserIds.find(workspaceUserId => workspaceUser.equals(workspaceUserId)))

  return invitedTeamMembers
}

TeamSchema.statics.updateUser = async function (
  id: string | ObjectId,
  teamMemberId: string | ObjectId,
  payload: object,
) {
  const _payload = MongoPayload.prependToKeys(payload, 'users.$')
  const filter = {
    _id: id,
    'users._id': teamMemberId,
  }
  const update = {
    $set: _payload,
  }
  const options = { new: true, runValidators: true }

  const team = await this.findOneAndUpdate(filter, update, options).populate('users')

  const teamUser = team.users.find(({ _id }) => _id.equals(teamMemberId))

  return teamUser
}

TeamSchema.statics.removeUser = function (
  id: string | ObjectId,
  teamMemberId: string | ObjectId,
) {
  const filter = { _id: id }
  const update = { $pull: { users: { _id: teamMemberId } } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

TeamSchema.statics.removeUserFromAllWorkspaceTeams = function (
  workspaceId: string | ObjectId,
  workspaceUserId: string | ObjectId,
): Promise<void> {
  const filter = {
    workspace: workspaceId,
  }
  const update = { $pull: { users: { workspaceUser: workspaceUserId } } }
  const options = { new: true, runValidators: true }

  return this.updateMany(filter, update, options)
}

TeamSchema.statics.listProjects = function (
  teamId: string | ObjectId,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(teamId),
    },
  }, {
    $lookup: {
      from: 'projects',
      localField: 'projects',
      foreignField: '_id',
      as: 'project',
    },
  }, {
    $unwind: '$project',
  }, {
    $replaceRoot: {
      newRoot: '$project',
    },
  }]

  return this.aggregate(pipeline)
}


TeamSchema.statics.addProject = async function (
  id: string | ObjectId,
  projectId: string | ObjectId | string[] | ObjectId[],
) {
  const filter = { _id: id }
  const update: any = {}

  if (Array.isArray(projectId)) {
    update.$addToSet = {
      projects: {
        $each: projectId,
      },
    }
  } else {
    update.$addToSet = {
      projects: projectId,
    }
  }

  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

TeamSchema.statics.removeProject = async function (
  id: string | ObjectId,
  projectId: string | ObjectId,
) {
  const filter = { _id: id }
  const update = { $pull: { projects: projectId } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

TeamSchema.statics.removeProjectFromAllTeams = async function (
  projectId: string | ObjectId,
) {
  const filter = {
    projects: new ObjectId(projectId),
  }
  const update = { $pull: { projects: projectId } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

TeamSchema.statics.getProjectIds = function (
  teamIds: string[] | ObjectId[],
): Promise<{ _id: ObjectId }[]> {
  return this.aggregate([{
    $match: {
      _id: { $in: teamIds.map(teamId => new ObjectId(teamId)) },
    },
  }, {
    $unwind: '$projects',
  }, {
    $project: {
      _id: '$projects',
    },
  }])
}
TeamSchema.statics.deleteTeamsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

export const TeamModel = mongoose.model<ITeamDocument, ITeamModel>('Team', TeamSchema)
