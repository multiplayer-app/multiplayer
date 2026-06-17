import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import { MongoPayload } from '@multiplayer/util'
import {
  IProject,
  ICursor,
  DataWithCursor,
  IProjectMember,
  IAccess,
  IssueCategoryEnum,
} from '@multiplayer/types'
import { SKIP, LIMIT } from '../config'
import { AccessSchema } from './shared/access.model'
import { SessionRecordingOptionsSchema } from './shared/session-recording-options.model'

const { Schema } = mongoose

export interface IProjectDocument extends Omit<IProject, '_id' | 'workspace'>, Document {
  _id: ObjectId

  workspace: ObjectId

  toObject(): IProject
  toJSON(): IProject
}

export interface IProjectModel extends Model<IProjectDocument> {
  createProject(payload: object): Promise<IProjectDocument>

  findProjectById(id: string | ObjectId): Promise<IProjectDocument | undefined>

  countProjectsInWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<number>

  findProjects(
    workspaceId: string | ObjectId,
    filter: {
      _ids?: ObjectId[] | string[],
      archived?: boolean,
    },
    cursor?: ICursor,
    joinTeams?: boolean,
  ): Promise<DataWithCursor<IProjectDocument>>

  updateProjectById(
    id: string | ObjectId,
    payload: object
  ): Promise<IProjectDocument | undefined>

  getProjectIdsInWorkspace(
    workspaceId: string | ObjectId
  ): Promise<{ _id: ObjectId }[]>

  getProjectsBasicInWorkspace(
    workspaceId: string | ObjectId
  ): Promise<{ _id: ObjectId, name: string, iconUrl?: string }[]>

  deleteProjectById(id: string | ObjectId): Promise<void>

  deleteProjectByIds(ids: Array<string | ObjectId>): Promise<void>

  getProjectsCursorInWorkspace(
    workspaceId: string | ObjectId
  ): any

  findTemplateProjects(): Promise<Array<IProjectDocument>>

  deleteProjectsByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  getProjectUsersByProjectUserIds(
    id: string | ObjectId,
    projectUserIds: Array<string | ObjectId>,
  ): Promise<Array<IProjectMember>>

  listUsers(
    id: string | ObjectId,
    cursor?: ICursor
  ): Promise<DataWithCursor<IProjectMember>>

  addUsers(
    id: string | ObjectId,
    workspaceUserIds: Array<string | ObjectId>,
    role: string | ObjectId,
  ): Promise<Array<IProjectMember>>

  updateUser(
    id: string | ObjectId,
    teamMemberId: string | ObjectId,
    payload: object
  ): Promise<IProjectMember | undefined>

  removeUser(
    id: string | ObjectId,
    teamMemberId: string | ObjectId
  ): Promise<void>

  removeUserFromAllWorkspaceProjects(
    workspaceId: string | ObjectId,
    workspaceUserId: string | ObjectId,
  ): Promise<void>

  updateProjectAccess(
    id: string | ObjectId,
    payload: Partial<IAccess>
  ): Promise<IAccess | undefined>

  updateConditionalRecordingSettings(
    id: string | ObjectId,
    payload: IProject['settings']['conditionalRecording']
  ): Promise<IProject['settings']['conditionalRecording'] | undefined>

  updateIssuesSettings(
    id: string | ObjectId,
    payload: IProject['settings']['issue'],
  ): Promise<IProject['settings']['issue'] | undefined>
}

const ProjectUserSchema = new Schema({
  workspaceUser: {
    type: ObjectId,
    ref: 'Workspace-User',
    required: true,
    index: true,
  },
  role: {
    type: ObjectId,
    ref: 'Role',
    required: true,
  },
})

const ProjectSchema = new Schema({
  // indicates that project is sample
  // and will be cloned by default to new users
  template: {
    type: Boolean,
  },
  // indicates that project is cloned from sample
  sample: {
    type: Boolean,
    default: false,
  },
  workspace: {
    type: ObjectId,
    ref: 'Workspaces',
    required: true,
    index: true,
  },
  users: [ProjectUserSchema],
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
  coverImageUrl: {
    type: String,
  },
  version: {
    type: String,
  },

  access: AccessSchema,

  settings: {
    issue: {
      createOnlyForCategories: [{
        type: String,
        enum: Object.values(IssueCategoryEnum),
      }],
    },
    agent: {
      fixabilityScoreThreshold: {
        type: Number,
      },
    },
    conditionalRecording: {
      enabled: {
        type: Boolean,
        default: false,
      },
      samplingRate: {
        type: Number,
      },
      maxRemoteSessionRecordings: {
        type: Number,
      },
      recordingOptions: SessionRecordingOptionsSchema,
      startConditions: {
        startOnError: {
          type: Boolean,
        },
      },
      stopConditions: {
        idleTime: {
          type: Number,
        },
        maxTime: {
          type: Number,
        },
      },
    },
  },
}, {
  timestamps: true,
})

ProjectSchema.statics.createProject = function (payload: object) {
  return new this(payload).save()
}

ProjectSchema.statics.findProjectById = function (id: string | ObjectId) {
  return this.findOne({ _id: id })
}

ProjectSchema.statics.countProjectsInWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<number> {
  return this.countDocuments({ workspace: workspaceId })
}

ProjectSchema.statics.findProjects = async function (
  workspaceId: string | ObjectId,
  filter: {
    _ids?: ObjectId[] | string[],
    archived?: boolean,
  },
  cursor: ICursor = {},
  joinTeams?: boolean,
) {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const conditions: any = {
    workspace: new ObjectId(workspaceId),
  }

  if (filter._ids) {
    conditions._id = {
      $in: filter._ids.map(_id => new ObjectId(_id)),
    }
  }

  if (filter.archived) {
    conditions.archived = true
  } else {
    conditions.archived = {
      $ne: true,
    }
  }

  const pipeline = [
    {
      $match: {
        ...conditions,
      },
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $skip: cursor.skip },
          { $limit: cursor.limit },
          ...joinTeams
            ? [{
              $lookup: {
                from: 'teams',
                localField: '_id',
                foreignField: 'projects',
                as: 'teams',
              },
            }]
            : [],
        ],
      },
    },
  ]

  const [{
    items,
    count: [{ count } = { count: 0 }],
  }] = await this.aggregate(pipeline)

  return {
    data: items,
    cursor: {
      total: count,
      skip: cursor.skip,
      limit: cursor.limit,
    },
  }
}

ProjectSchema.statics.updateProjectById = function (
  id: string | ObjectId,
  payload: object,
) {
  return this.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: payload,
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

ProjectSchema.statics.deleteProjectById = function (
  id: string | ObjectId,
) {
  return this.deleteOne({ _id: id })
}

ProjectSchema.statics.deleteProjectByIds = function (
  ids: Array<string | ObjectId>,
) {
  return this.deleteMany({
    _id: { $in: ids },
  })
}

ProjectSchema.statics.getProjectIdsInWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<{ _id: ObjectId }[]> {
  return this.find({
    workspace: workspaceId,
  }, {
    _id: 1,
  })
}

ProjectSchema.statics.getProjectsBasicInWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<{ _id: ObjectId, name: string, iconUrl?: string }[]> {
  return this.find({
    workspace: workspaceId,
  }, {
    _id: 1,
    name: 1,
    iconUrl: 1,
  })
}

ProjectSchema.statics.getProjectsCursorInWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<any> {
  return this.find({
    workspace: workspaceId,
  }).sort({ _id: 1 }).cursor()
}

ProjectSchema.statics.findTemplateProjects = function () {
  return this.find({ template: true })
}

ProjectSchema.statics.deleteProjectsByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

ProjectSchema.statics.getProjectUsersByProjectUserIds = async function (
  id: string | ObjectId,
  projectUserIds: Array<string | ObjectId>,
) {
  const pipeline = [{
    $match: {
      _id: new ObjectId(id),
    },
  }, {
    $unwind: '$users',
  }, {
    $replaceRoot: {
      newRoot: '$users',
    },
  }, {
    $match: {
      _id: {
        $in: projectUserIds.map(_id => new ObjectId(_id)),
      },
    },
  }, {
    $lookup: {
      from: 'workspace-users',
      localField: 'workspaceUser',
      foreignField: '_id',
      as: 'workspaceUser',
    },
  }, {
    $unwind: '$workspaceUser',
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
  }]

  const workspaceMembers = await this.aggregate(pipeline)

  return workspaceMembers
}

ProjectSchema.statics.listUsers = async function (
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

ProjectSchema.statics.addUsers = async function (
  id: string | ObjectId,
  workspaceUserIds: Array<string | ObjectId>,
  role: string | ObjectId,
) {
  const filter = {
    _id: new ObjectId(id),
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

  const project = await this.findOneAndUpdate(filter, update, options)

  const invitedProjectMembers = project.users
    .filter(({ workspaceUser }) => workspaceUserIds.find(workspaceUserId => workspaceUser.equals(workspaceUserId)))

  return invitedProjectMembers
}

ProjectSchema.statics.updateUser = async function (
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

  const project = await this.findOneAndUpdate(filter, update, options).populate('users')

  const projectUser = project.users.find(({ _id }) => _id.equals(teamMemberId))

  return projectUser
}

ProjectSchema.statics.removeUser = function (
  id: string | ObjectId,
  projectMemberId: string | ObjectId,
) {
  const filter = { _id: id }
  const update = { $pull: { users: { _id: projectMemberId } } }
  const options = { new: true, runValidators: true }

  return this.findOneAndUpdate(filter, update, options)
}

ProjectSchema.statics.removeUserFromAllWorkspaceProjects = function (
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

ProjectSchema.statics.updateProjectAccess = async function (
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

ProjectSchema.statics.updateConditionalRecordingSettings = async function (
  id: string | ObjectId,
  payload: IProject['settings']['conditionalRecording'],
): Promise<IProject['settings']['conditionalRecording'] | undefined> {
  const _payload = MongoPayload.prependToKeys(MongoPayload.flattenObject(payload), 'settings.conditionalRecording')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const { settings } = await this.findOneAndUpdate(
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

  return settings.conditionalRecording
}

ProjectSchema.statics.updateIssuesSettings = async function (
  id: string | ObjectId,
  payload: IProject['settings']['issue'],
): Promise<IProject['settings']['issue'] | undefined> {
  const _payload = MongoPayload.prependToKeys(MongoPayload.flattenObject(payload), 'settings.issue')
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  const { settings } = await this.findOneAndUpdate(
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

  return settings.issue
}

export const ProjectModel = mongoose.model<IProjectDocument, IProjectModel>('Project', ProjectSchema)
