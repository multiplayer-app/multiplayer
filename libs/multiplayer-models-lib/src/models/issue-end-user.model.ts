import { mongoose, ObjectId } from '@multiplayer/mongo'
import { Model } from 'mongoose'
import {
  IIssue,
  IIssueEndUser,
  ICursor,
  DataWithCursor,
  IssueSeverityLevel,
  IssueCategoryEnum,
  EndUserState,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'
import { ISortOptions } from '../types'
import { EndUserSchema } from './end-user.model'
import { IssueSchema } from './issue.model'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

const buildIssueMatchConditions = (filter: {
  ids?: string[] | ObjectId[],
  hash?: string | string[],
  titleHash?: string | string[],

  resolved?: boolean,
  archived?: boolean,
  severity?: IssueSeverityLevel,
  title?: string,
  'service.serviceNameSlug'?: string,
  'service.environmentSlug'?: string,
  'lastSeen.gte'?: string | Date,
  'lastSeen.lte'?: string | Date,
  text?: string,
}) => {
  const {
    ids,
    hash,
    titleHash,
    text,
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    title,
    'service.serviceNameSlug': serviceNameSlug,
    'service.environmentSlug': environmentSlug,
    severity,
    resolved,
    archived,
    ..._filter
  } = filter

  const matchConditions: any = {
    ...ids?.length
      ? {
        'issue._id': {
          $in: ids.map(id => new ObjectId(id)),
        },
      }
      : {},
    ...hash
      ? {
        'issue.hash': Array.isArray(hash)
          ? {
            $in: hash,
          }
          : hash,
      }
      : {},
    ...titleHash
      ? {
        'issue.titleHash': Array.isArray(titleHash)
          ? {
            $in: titleHash,
          }
          : titleHash,
      }
      : {},
    ...MongoPayload.prependToKeys(_filter, 'issue'),
  }

  if ('archived' in filter) {
    matchConditions['issue.archived'] = filter.archived
  } else {
    matchConditions['issue.archived'] = {
      $ne: true,
    }
  }

  if ('resolved' in filter) {
    matchConditions['issue.resolved'] = filter.resolved
  } else {
    matchConditions['issue.resolved'] = {
      $ne: true,
    }
  }

  if (text) {
    matchConditions.$or = [{
      'issue.title': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.message': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.stacktrace': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.httpTarget': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.httpUrl': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.httpRoute': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.metadata.httpMethod': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'issue.service.serviceNameSlug': {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  if (lastSeenGte) {
    matchConditions['issue.lastSeen'] = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions['issue.lastSeen'] = {
      ...(matchConditions.lastSeen || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (title) {
    matchConditions['issue.title'] = {
      $regex: new RegExp(title, 'i'),
    }
  }

  return matchConditions
}

const buildEndUserMatchConditions = (filter: {
  id?: string[] | ObjectId[] | string | ObjectId,

  'attributes.type'?: string,
  'attributes.id'?: string,
  'attributes.name'?: string,
  'attributes.groupId'?: string,
  'attributes.groupName'?: string,
  'attributes.userEmail'?: string,
  'attributes.userId'?: string,
  'attributes.userName'?: string,
  'attributes.accountId'?: string,
  'attributes.accountName'?: string,
  'attributes.orgId'?: string,
  'attributes.orgName'?: string,

  'lastSeen.gte'?: string | Date,
  'lastSeen.lte'?: string | Date,

  online?: boolean,
  state?: EndUserState,

  text?: string,
}) => {

  const {
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    text,
    id,
    online,
    ..._filter
  } = filter

  const matchConditions: any = {
    ...MongoPayload.prependToKeys(_filter, 'endUser'),
  }

  if (id) {
    if (Array.isArray(id)) {
      matchConditions['endUser._id'] = {
        $in: id.map((id) => new ObjectId(id)),
      }
    } else {
      matchConditions['endUser._id'] = new ObjectId(id)
    }
  }

  if (lastSeenGte) {
    matchConditions['endUser.lastSeen'] = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions['endUser.lastSeen'] = {
      ...(matchConditions['endUser.lastSeen'] || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (typeof online === 'boolean') {
    matchConditions['endUser.connections.0'] = {
      $exists: online,
    }
  }

  if (text) {
    // matchConditions.$text = {
    //   $search: text,
    // }
    matchConditions.$or = [{
      'endUser.attributes.id': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.name': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.groupId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.groupName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.userEmail': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.userId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.userName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.accountId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.accountName': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.orgId': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'endUser.attributes.orgName': {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  return matchConditions
}

export interface IIssueEndUserDocument extends Omit<IIssueEndUser, '_id' | 'workspace' | 'project'>, Document {
  _id: ObjectId

  workspace: string | ObjectId

  project: string | ObjectId

  createdAt: Date

  updatedAt: Date

  toObject(): IIssueEndUserDocument
}

export interface IIssueEndUserModel extends Model<IIssueEndUserDocument> {
  createIssueEndUser(
    payload: Partial<IIssueEndUser>
  ): Promise<IIssueEndUserDocument>

  findIssueEndUserById(
    id: string | ObjectId
  ): Promise<IIssueEndUserDocument | undefined>

  findIssueEndUserByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IIssueEndUserDocument | undefined>

  findIssueByIssueEndUserHash(
    id: string | ObjectId
  ): Promise<IIssueEndUserDocument | undefined>

  findIssuesEndUsers(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,

      issue?: {
        archived?: boolean,
        resolved?: boolean,

        title?: string,

        severity?: IssueSeverityLevel,
        category?: IssueCategoryEnum,

        'service.serviceNameSlug'?: string,
        'service.environmentSlug'?: string,

        'lastSeen.gte'?: string | Date,
        'lastSeen.lte'?: string | Date,

        text?: string,
        hash?: string | string[],
        titleHash?: string | string[],
      }

      endUser?: {
        hash?: string,

        'attributes.type'?: string,
        'attributes.id'?: string,
        'attributes.name'?: string,
        'attributes.groupId'?: string,
        'attributes.groupName'?: string,
        'attributes.userEmail'?: string,
        'attributes.userId'?: string,
        'attributes.userName'?: string,
        'attributes.accountId'?: string,
        'attributes.accountName'?: string,
        'attributes.orgId'?: string,
        'attributes.orgName'?: string,

        'lastSeen.gte'?: string | Date,
        'lastSeen.lte'?: string | Date,

        online?: boolean,
        state?: EndUserState,

        text?: string,
      }
    },
    cursor: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IIssueEndUserDocument>>

  deleteIssueEndUserById(
    id: string | ObjectId,
  ): Promise<void>

  deleteIssuesEndUsersByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteIssuesEndUsersByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  bulkUpdateIssuesEndUsersByIssue(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter: {
      ids?: string[] | ObjectId[],
      hash?: string[],
      titleHash?: string[],

      resolved?: boolean,
      archived?: boolean,
      severity?: IssueSeverityLevel,
    },
    payload: Pick<IIssue, 'resolved' | 'archived' | 'severity'>,
  ): Promise<IIssueEndUserDocument[]>

  bulkDeleteIssuesEndUsersByIssue(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter: {
      ids?: string[] | ObjectId[],
      hash?: string[],
      titleHash?: string[],

      resolved?: boolean,
      archived?: boolean,
      severity?: IssueSeverityLevel,
      title?: string,
      'service.serviceNameSlug'?: string,
      'service.environmentSlug'?: string,
      'lastSeen.gte'?: string | Date,
      'lastSeen.lte'?: string | Date,
      text?: string,
    },
  ): Promise<void>

  bulkDeleteIssuesEndUsersByEndUser(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter: {
      ids?: string[] | ObjectId[],
    },
  ): Promise<void>
}

const IssueEndUserSchema = new Schema({
  workspace: {
    type: ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  project: {
    type: ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },

  issue: IssueSchema,
  endUser: EndUserSchema,

  lastSeen: {
    type: Date,
  },
}, {
  timestamps: true,
})

IssueEndUserSchema.statics.createIssueEndUser = async function (
  payload: IIssueEndUser,
) {
  const lastSeen = new Date()

  return this.findOneAndUpdate(
    {
      'issue.hash': payload.issue.hash,
      'endUser.hash': payload.endUser.hash,
    },
    {
      lastSeen,
      ...payload,
    },
    {
      upsert: true,
      new: true,
      // runValidators: true,
    },
  )
}

IssueEndUserSchema.statics.findIssueEndUserById = function (
  id: string | ObjectId,
) {
  const conditions: any = {
    _id: id,
  }

  return this.findOne(conditions)
}

IssueEndUserSchema.statics.findIssueEndUserByIdAndProjectAndWorkspace = async function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
): Promise<IIssueEndUserDocument | undefined> {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

IssueEndUserSchema.statics.findIssueByIssueEndUserHash = function (
  hash: string,
) {
  const conditions: any = {
    hash,
  }

  return this.findOne(conditions)
}

IssueEndUserSchema.statics.findIssuesEndUsers = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,

    issue?: {
      archived?: boolean,
      resolved?: boolean,

      title?: string,

      severity?: IssueSeverityLevel,
      category?: IssueCategoryEnum,

      'service.serviceNameSlug'?: string,
      'service.environmentSlug'?: string,

      'lastSeen.gte'?: string | Date,
      'lastSeen.lte'?: string | Date,

      text?: string,
      hash?: string | string[],
      titleHash?: string | string[],
    }

    endUser?: {
      hash?: string,

      'attributes.type'?: string,
      'attributes.id'?: string,
      'attributes.name'?: string,
      'attributes.groupId'?: string,
      'attributes.groupName'?: string,
      'attributes.userEmail'?: string,
      'attributes.userId'?: string,
      'attributes.userName'?: string,
      'attributes.accountId'?: string,
      'attributes.accountName'?: string,
      'attributes.orgId'?: string,
      'attributes.orgName'?: string,

      'lastSeen.gte'?: string | Date,
      'lastSeen.lte'?: string | Date,

      online?: boolean,
      state?: EndUserState,

      text?: string,
    }
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
): Promise<DataWithCursor<IIssueEndUserDocument>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const {
    issue: _issueFilter,
    endUser: _endUserFilter,
    workspace,
    project,
  } = filter

  let matchConditions: any = {
    workspace: new ObjectId(workspace),
    project: new ObjectId(project),
  }

  if (_issueFilter && Object.keys(_issueFilter).length) {
    matchConditions = {
      ...matchConditions,
      ...buildIssueMatchConditions(_issueFilter),
    }
  }

  if (_endUserFilter && Object.keys(_endUserFilter).length) {
    matchConditions = {
      ...matchConditions,
      ...buildEndUserMatchConditions(_endUserFilter),
    }
  }

  const pipeline = [
    {
      $match: matchConditions,
    },
    {
      $facet: {
        count: [{ $count: 'count' }],
        items: [
          { $sort: _sort },
          ...(
            typeof cursor?.skip === 'number'
            && typeof cursor?.limit === 'number'
          )
            ? [
              { $skip: cursor.skip },
              { $limit: cursor.limit },
            ]
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

IssueEndUserSchema.statics.deleteIssueEndUserById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

IssueEndUserSchema.statics.deleteIssuesEndUsersByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

IssueEndUserSchema.statics.deleteIssuesEndUsersByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

IssueEndUserSchema.statics.bulkUpdateIssuesEndUsersByIssue = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter: {
    ids?: string[] | ObjectId[],
    hash?: string[],
    titleHash?: string[],

    resolved?: boolean,
    archived?: boolean,
    severity?: IssueSeverityLevel,
  },
  payload: Pick<IIssue, 'resolved' | 'archived' | 'severity'>,
): Promise<IIssueEndUserDocument[]> {
  // const {
  //   ids,
  //   hash,
  //   titleHash,
  //   ..._issueFilter
  // } = filter
  const matchConditions: any = {
    workspace: workspaceId,
    project: projectId,
    ...buildIssueMatchConditions(filter),
  }

  await this.updateMany(
    matchConditions,
    {
      $set: MongoPayload.prependToKeys(payload, 'issue'),
    },
  )

  return this.find({
    ...matchConditions,
    ...payload,
  })
}

IssueEndUserSchema.statics.bulkDeleteIssuesEndUsersByIssue = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter: {
    ids?: string[] | ObjectId[],
    hash?: string[],
    titleHash?: string[],

    resolved?: boolean,
    archived?: boolean,
    severity?: IssueSeverityLevel,
    title?: string,
    'service.serviceNameSlug'?: string,
    'service.environmentSlug'?: string,
    'lastSeen.gte'?: string | Date,
    'lastSeen.lte'?: string | Date,
    text?: string,
  },
): Promise<void> {
  const matchConditions: any = {
    workspace: workspaceId,
    project: projectId,
    ...buildIssueMatchConditions(filter),
  }

  return this.deleteMany(matchConditions)
}

IssueEndUserSchema.statics.bulkDeleteIssuesEndUsersByEndUser = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter: {
    ids?: string[] | ObjectId[],
  },
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
    ...filter.ids?.length
      ? {
        'endUser._id': {
          $in: filter.ids.map(id => new ObjectId(id)),
        },
      }
      : {},
  })
}

IssueEndUserSchema.index({
  workspace: 1,
  project: 1,
})

IssueEndUserSchema.index({
  'issue.hash': 1,
  'endUser.hash': 1,
}, {
  unique: true,
})

IssueSchema.index(
  {
    lastSeen: 1,
  },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90, // 90 days
  },
)

export const IssueEndUserModel = mongoose.model<IIssueEndUserDocument, IIssueEndUserModel>(
  'Issue-End-User',
  IssueEndUserSchema,
)
