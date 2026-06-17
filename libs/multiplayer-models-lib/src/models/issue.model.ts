import { mongoose, ObjectId } from '@multiplayer/mongo'
import { MongoPayload } from '@multiplayer/util'
import { Model, PipelineStage } from 'mongoose'
import {
  IIssue,
  ICursor,
  DataWithCursor,
  IssueSeverityLevel,
  IssueCategoryEnum,
  IssueGroupBy,
} from '@multiplayer/types'
import { ISortOptions } from '../types'
import { SKIP, LIMIT } from '../config'

const { Schema } = mongoose

export interface IIssueDocument extends Omit<IIssue, '_id' | 'workspace' | 'project'>, Document {
  _id: ObjectId

  workspace: string | ObjectId

  project: string | ObjectId

  createdAt: Date

  updatedAt: Date

  toObject(): IIssue
}

export interface IIssueModel extends Model<IIssueDocument> {
  createIssue(
    payload: Partial<IIssue>
  ): Promise<IIssueDocument>

  findIssueById(
    id: string | ObjectId
  ): Promise<IIssueDocument | undefined>

  findIssueByIdAndProjectAndWorkspace(
    id: string | ObjectId,
    projectId: string | ObjectId,
    workspaceId: string | ObjectId
  ): Promise<IIssueDocument | undefined>

  findIssueByHash(
    hash: string
  ): Promise<IIssueDocument | undefined>

  findIssues(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
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
      componentHash?: string | string[],
      customHash?: string | string[],
    },
    cursor?: ICursor,
    sort?: ISortOptions,
    groupBy?: IssueGroupBy,
    $project?: any,
  ): Promise<DataWithCursor<IIssueDocument>>

  findSimilarIssues(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      id: string | ObjectId,
      hash: string[],

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
    },
    cursor?: ICursor,
    sort?: ISortOptions,
  ): Promise<DataWithCursor<IIssueDocument>>

  updateIssueById(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    id: string | ObjectId,
    payload: Pick<IIssue, 'resolved' | 'archived' | 'severity' | 'solution'>,
  ): Promise<IIssueDocument | undefined>

  deleteIssueById(
    id: string | ObjectId,
  ): Promise<void>

  deleteIssuesByWorkspace(
    workspaceId: string | ObjectId,
  ): Promise<void>

  deleteIssuesByProject(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
  ): Promise<void>

  bulkUpdateIssues(
    workspaceId: string | ObjectId,
    projectId: string | ObjectId,
    filter: {
      ids?: string[] | ObjectId[],
      hash?: string[],
      titleHash?: string[],
      componentHash?: string[],
      customHash?: string[],

      resolved?: boolean,
      archived?: boolean,
      severity?: IssueSeverityLevel,
      solutionAgent?: string | ObjectId,
    },
    payload: Partial<Pick<IIssue, 'resolved' | 'archived' | 'severity' | 'fixabilityScore' | 'solution'>>,
  ): Promise<IIssueDocument[]>

  bulkDeleteIssues(
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

  findIssueByComponentHash(
    componentHash: string,
  ): Promise<IIssueDocument | undefined>

  findIssueWithoutSolution(
    filter: {
      workspace: string | ObjectId,
      project: string | ObjectId,
      integration?: string[] | ObjectId[],
      componentName?: string[],
      environmentName?: string[],
    },
  ): Promise<IIssueDocument | undefined>
}

export const IssueSchema = new Schema({
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

  hash: {
    type: String,
    required: true,
    index: true,
  },
  titleHash: {
    type: String,
    index: true,
    required: true,
  },
  componentHash: {
    type: String,
    index: true,
  },
  customHash: {
    type: String,
    index: true,
  },
  title: {
    type: String,
    required: true,
    index: true,
  },

  resolved: {
    type: Boolean,
    required: true,
    default: false,
  },
  archived: {
    type: Boolean,
    required: true,
    default: false,
  },

  severity: {
    type: Number,
    enum: Object.values(IssueSeverityLevel),
  },
  fixabilityScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  category: {
    type: String,
    enum: Object.values(IssueCategoryEnum),
    required: true,
  },

  metadata: {
    culprit: {
      type: String,
    },
    message: {
      type: String,
      index: true,
    },
    stacktrace: {
      type: String,
      index: true,
    },
    spanKind: {
      type: Number,
    },

    httpTarget: {
      type: String,
      index: true,
    },
    httpUrl: {
      type: String,
      index: true,
    },
    httpRoute: {
      type: String,
    },
    httpMethod: {
      type: String,
    },

    value: {
      type: String,
    },
    type: {
      type: String,
    },
    filename: {
      type: String,
    },
    function: {
      type: String,
    },
  },

  service: {
    serviceName: {
      type: String,
      required: true,
    },
    release: {
      type: String,
    },
    environment: {
      type: String,
    },

    serviceNameSlug: {
      type: String,
      required: true,
      index: true,
    },
    environmentSlug: {
      type: String,
    },
  },

  solution: {
    inProgress: {
      type: Boolean,
      default: false,
    },
    agent: {
      type: ObjectId,
      ref: 'Agent',
      index: true,
    },
    fixWithAgentFailed: {
      type: Boolean,
    },
    gitBranch: {
      type: String,
    },
    gitRepositoryUrl: {
      type: String,
    },
    prUrl: {
      type: String,
    },
  },

  lastSeen: {
    type: Date,
  },

  integration: {
    type: ObjectId,
    ref: 'Integration',
  },
}, {
  timestamps: true,
})

IssueSchema.statics.createIssue = async function (
  payload: Partial<IIssue>,
) {
  const lastSeen = new Date()

  return this.findOneAndUpdate(
    {
      hash: payload.hash,
    },
    {
      $set: {
        lastSeen,
        ...payload,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )
}

IssueSchema.statics.findIssueById = function (
  id: string | ObjectId,
) {
  const conditions: any = {
    _id: id,
  }

  return this.findOne(conditions)
}

IssueSchema.statics.findIssueByIdAndProjectAndWorkspace = async function (
  id: string | ObjectId,
  projectId: string | ObjectId,
  workspaceId: string | ObjectId,
): Promise<IIssueDocument | undefined> {
  return this.findOne({
    _id: id,
    workspace: workspaceId,
    project: projectId,
  })
}

IssueSchema.statics.findIssueByHash = function (
  hash: string,
) {
  const conditions: any = {
    hash,
  }

  return this.findOne(conditions)
}

IssueSchema.statics.findIssues = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
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
    componentHash?: string | string[],
    customHash?: string | string[],
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
  groupBy?: IssueGroupBy,
  $project?: any,
): Promise<DataWithCursor<IIssueDocument>> {
  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const {
    archived,
    resolved,
    workspace,
    project,
    text,
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    title,
    hash,
    titleHash,
    componentHash,
    customHash,
    ..._filter
  } = filter

  const matchConditions: any = {
    workspace: new ObjectId(workspace),
    project: new ObjectId(project),
    ..._filter,
  }

  if (hash) {
    if (Array.isArray(hash)) {
      matchConditions.hash = {
        $in: hash,
      }
    } else {
      matchConditions.hash = hash
    }
  }

  if (titleHash) {
    if (Array.isArray(titleHash)) {
      matchConditions.titleHash = {
        $in: titleHash,
      }
    } else {
      matchConditions.titleHash = titleHash
    }
  }

  if (componentHash) {
    if (Array.isArray(componentHash)) {
      matchConditions.componentHash = {
        $in: componentHash,
      }
    } else {
      matchConditions.componentHash = componentHash
    }
  }

  if (customHash) {
    if (Array.isArray(customHash)) {
      matchConditions.customHash = {
        $in: customHash,
      }
    } else {
      matchConditions.customHash = customHash
    }
  }

  if ('archived' in filter) {
    matchConditions.archived = filter.archived
      ? filter.archived
      : { $ne: true }
  }

  if ('resolved' in filter) {
    matchConditions.resolved = filter.resolved
      ? filter.resolved
      : { $ne: true }
  }

  if (text) {
    // matchConditions.$text = {
    //   $search: text,
    //   $caseSensitive: false,
    // }
    matchConditions.$or = [{
      'title': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.message': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.stacktrace': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpTarget': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpUrl': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpRoute': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpMethod': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'service.serviceNameSlug': {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  if (lastSeenGte) {
    matchConditions.lastSeen = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions.lastSeen = {
      ...(matchConditions.lastSeen || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (title) {
    matchConditions.title = {
      $regex: new RegExp(title, 'i'),
    }
  }

  const pipeline = [
    {
      $match: matchConditions,
    },


    ...(groupBy
      ? [{
        $group: {
          _id: `$${groupBy}`,
          id: { $last: '$_id' },
          workspace: { $last: '$workspace' },
          project: { $last: '$project' },

          hash: { $last: '$hash' },
          titleHash: { $last: '$titleHash' },
          componentHash: { $last: '$componentHash' },

          title: { $last: '$title' },
          resolved: { $last: '$resolved' },
          archived: { $last: '$archived' },
          severity: { $last: '$severity' },
          metadata: { $last: '$metadata' },
          category: { $last: '$category' },
          fixabilityScore: { $last: '$fixabilityScore' },

          serviceName: { $first: '$service.serviceName' },
          serviceNameSlug: { $first: '$service.serviceNameSlug' },
          releases: { $addToSet: '$service.release' },
          environments: { $addToSet: '$service.environment' },
          environmentsSlug: { $addToSet: '$service.environmentSlug' },


          lastSeen: { $last: '$lastSeen' },
          createdAt: { $last: '$createdAt' },
          updatedAt: { $last: '$updatedAt' },
        },
      }, {
        $project: {
          _id: '$id',
          workspace: 1,
          project: 1,
          componentHash: 1,
          hash: 1,
          titleHash: 1,
          title: 1,
          resolved: 1,
          archived: 1,
          severity: 1,
          metadata: 1,
          category: 1,
          fixabilityScore: 1,

          service: {
            serviceName: '$serviceName',
            serviceNameSlug: '$serviceNameSlug',
            releases: '$releases',
            environments: '$environments',
            environmentsSlug: '$environmentsSlug',
          },

          lastSeen: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }]
      : []
    ),

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
          ...$project ? [{ $project }] : [],
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

IssueSchema.statics.findSimilarIssues = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    id: string | ObjectId,
    hash: string[],

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
  },
  cursor: ICursor = {},
  sort?: ISortOptions,
): Promise<DataWithCursor<IIssueDocument>> {
  cursor.skip = cursor.skip || SKIP
  cursor.limit = cursor.limit || LIMIT

  const _sort: any = {}

  if (sort?.sortKey && sort?.sortDirection) {
    _sort[sort.sortKey] = sort.sortDirection
  } else {
    _sort._id = -1
  }

  const {
    archived,
    resolved,
    workspace,
    project,
    hash,
    text,
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    title,
    ..._filter
  } = filter

  const matchConditions: any = {
    workspace: new ObjectId(workspace),
    project: new ObjectId(project),
    _id: { $ne: new ObjectId(filter.id) },
    $or: [
      { hash: { $in: hash } },
      { componentHash: { $in: hash } },
      { customHash: { $in: hash } },
    ],
    ..._filter,
  }

  if ('archived' in filter) {
    matchConditions.archived = filter.archived
      ? filter.archived
      : { $ne: true }
  }

  if ('resolved' in filter) {
    matchConditions.resolved = filter.resolved
      ? filter.resolved
      : { $ne: true }
  }

  if (text) {
    // matchConditions.$text = {
    //   $search: text,
    //   $caseSensitive: false,
    // }
    matchConditions.$or = [{
      'title': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.message': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.stacktrace': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpTarget': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpUrl': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpRoute': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'metadata.httpMethod': {
        $regex: text,
        $options: 'i',
      },
    }, {
      'service.serviceNameSlug': {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  if (lastSeenGte) {
    matchConditions.lastSeen = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions.lastSeen = {
      ...(matchConditions.lastSeen || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (title) {
    matchConditions.title = {
      $regex: new RegExp(title, 'i'),
    }
  }

  const pipeline = [{
    $match: matchConditions,
  }, {
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
  }]

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

IssueSchema.statics.updateIssueById = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  id: string | ObjectId,
  payload: Pick<IIssue, 'resolved' | 'archived' | 'severity'>,
): Promise<IIssueDocument | undefined> {
  return this.findOneAndUpdate(
    {
      _id: id,
      workspace: workspaceId,
      project: projectId,
    },
    {
      $set: {
        ...payload,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
}

IssueSchema.statics.deleteIssueById = function (
  id: string | ObjectId,
): Promise<void> {
  return this.deleteOne({
    _id: id,
  })
}

IssueSchema.statics.deleteIssuesByWorkspace = function (
  workspaceId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
  })
}

IssueSchema.statics.deleteIssuesByProject = function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
): Promise<void> {
  return this.deleteMany({
    workspace: workspaceId,
    project: projectId,
  })
}

IssueSchema.statics.bulkUpdateIssues = async function (
  workspaceId: string | ObjectId,
  projectId: string | ObjectId,
  filter: {
    ids?: string[] | ObjectId[],
    hash?: string[],
    titleHash?: string[],
    componentHash?: string[],
    customHash?: string[],

    resolved?: boolean,
    archived?: boolean,
    severity?: IssueSeverityLevel,
    solutionAgent: string | ObjectId,
  },
  payload: Partial<Pick<IIssue, 'resolved' | 'archived' | 'severity' | 'fixabilityScore' | 'solution'>>,
): Promise<IIssueDocument[]> {
  const {
    ids,
    hash,
    titleHash,
    componentHash,
    customHash,
    solutionAgent,
    ..._filter
  } = filter
  const matchConditions: any = {
    workspace: workspaceId,
    project: projectId,
    ...ids?.length
      ? {
        _id: {
          $in: ids.map(id => new ObjectId(id)),
        },
      }
      : {},
    ...hash?.length
      ? {
        hash: {
          $in: hash,
        },
      }
      : {},
    ...titleHash?.length
      ? {
        titleHash: {
          $in: titleHash,
        },
      }
      : {},
    ...componentHash?.length
      ? {
        componentHash: {
          $in: componentHash,
        },
      }
      : {},
    ...customHash?.length
      ? {
        customHash: {
          $in: customHash,
        },
      }
      : {},
    ...solutionAgent
      ? {
        'solution.agent': new ObjectId(solutionAgent),
      }
      : {},
    ..._filter,
  }

  const _payload = MongoPayload.flattenObject(payload)
  const { set, unset } = MongoPayload.groupBySetUnset(_payload)

  await this.updateMany(
    matchConditions,
    {
      $set: set,
      $unset: unset,
    },
  )

  return this.find({
    ...matchConditions,
    ...payload,
  })
}

IssueSchema.statics.bulkDeleteIssues = function (
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
  const {
    ids,
    hash,
    titleHash,
    title,
    'lastSeen.gte': lastSeenGte,
    'lastSeen.lte': lastSeenLte,
    text,
    ..._filter
  } = filter


  const matchConditions: any = {
    workspace: workspaceId,
    project: projectId,

    ...ids?.length
      ? {
        _id: {
          $in: ids.map(id => new ObjectId(id)),
        },
      }
      : {},
    ...hash?.length
      ? {
        hash: {
          $in: hash,
        },
      }
      : {},
    ...titleHash?.length
      ? {
        titleHash: {
          $in: titleHash,
        },
      }
      : {},
    ..._filter,
  }

  if ('archived' in filter) {
    matchConditions.archived = filter.archived
      ? filter.archived
      : { $ne: true }
  }

  if ('resolved' in filter) {
    matchConditions.resolved = filter.resolved
      ? filter.resolved
      : { $ne: true }
  }

  if (text) {
    matchConditions.$or = [{
      title: {
        $regex: text,
        $options: 'i',
      },
    }, {
      message: {
        $regex: text,
        $options: 'i',
      },
    }, {
      stacktrace: {
        $regex: text,
        $options: 'i',
      },
    }, {
      httpTarget: {
        $regex: text,
        $options: 'i',
      },
    }, {
      httpUrl: {
        $regex: text,
        $options: 'i',
      },
    }, {
      serviceNameSlug: {
        $regex: text,
        $options: 'i',
      },
    }]
  }

  if (lastSeenGte) {
    matchConditions.lastSeen = {
      $gte: new Date(lastSeenGte),
    }
  }

  if (lastSeenLte) {
    matchConditions.lastSeen = {
      ...(matchConditions.lastSeen || {}),
      $lte: new Date(lastSeenLte),
    }
  }

  if (title) {
    matchConditions.title = {
      $regex: new RegExp(title, 'i'),
    }
  }

  return this.deleteMany(matchConditions)
}

IssueSchema.index({
  title: 'text',

  'metadata.culprit': 'text',
  'metadata.message': 'text',
  'metadata.stacktrace': 'text',
  'metadata.spanKind': 'text',

  'metadata.httpTarget': 'text',
  'metadata.httpUrl': 'text',

  'metadata.value': 'text',
  'metadata.type': 'text',
  'metadata.filename': 'text',
  'metadata.function': 'text',

  'service.serviceName': 'text',
  'service.release': 'text',
  'service.environment': 'text',
  'service.serviceNameSlug': 'text',
  'service.environmentSlug': 'text',
})

IssueSchema.statics.findIssueByComponentHash = async function (
  componentHash: string,
): Promise<IIssueDocument | undefined> {
  const conditions: any = {
    componentHash,
  }

  return this.findOne(conditions)
}

IssueSchema.statics.findIssueWithoutSolution = async function (
  filter: {
    workspace: string | ObjectId,
    project: string | ObjectId,
    integration?: string[] | ObjectId[],
    componentName?: string[],
    environmentName?: string[],
  },
): Promise<IIssueDocument | undefined> {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        'solution.inProgress': { $ne: true },
        // 'solution.gitBranch': { $exists: false },
        'solution.fixWithAgentFailed': { $ne: true },
        resolved: { $ne: true },
        archived: { $ne: true },
        workspace: new ObjectId(filter.workspace),
        project: new ObjectId(filter.project),
        ...(
          filter.integration?.length
            ? {
              $or: [
                {
                  integration: {
                    $in: filter.integration.map(id => new ObjectId(id)),
                  },
                },
                {
                  integration: { $exists: false },
                },
              ],
            }
            : {}
        ),
        ...(
          filter.componentName?.length
            ? {
              'service.serviceName': { $in: filter.componentName },
            }
            : {}
        ),
        ...(
          filter.environmentName?.length
            ? {
              'service.environment': { $in: filter.environmentName },
            }
            : {}
        ),
      },
    },
    {
      $sort: {
        lastSeen: -1,
      },
    },
    {
      $group: {
        _id: '$componentHash',
        issue: { $first: '$$ROOT' },
      },
    },
    {
      $limit: 1,
    },
    {
      $replaceRoot: {
        newRoot: '$issue',
      },
    },
  ]

  const [issue] = await this.aggregate(pipeline)

  return issue
}

IssueSchema.index({
  workspace: 1,
  project: 1,
})

IssueSchema.index(
  {
    lastSeen: 1,
  },
  {
    expireAfterSeconds: 60 * 60 * 24 * 90, // 90 days
  },
)

export const IssueModel = mongoose.model<IIssueDocument, IIssueModel>('Issue', IssueSchema)
