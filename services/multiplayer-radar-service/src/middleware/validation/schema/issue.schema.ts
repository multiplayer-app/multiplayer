import { Joi } from '@multiplayer/util'
import {
  IssueSeverityLevel,
  EndUserType,
  IssueCategoryEnum,
  IssueGroupBy,
} from '@multiplayer/types'
import {
  MetricsGranularity,
} from '../../../types'

export const listIssuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    resolved: Joi.boolean(),
    archived: Joi.boolean(),

    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),
    category: Joi.string().valid(...Object.values(IssueCategoryEnum)),

    title: Joi.string().max(256),
    'service.serviceNameSlug': Joi.string().max(256),
    'service.environmentSlug': Joi.string().max(256),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),

    hash: Joi.string(),
    titleHash: Joi.string(),
    componentHash: Joi.string(),
    customHash: Joi.string(),

    // metrics params
    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }).required(),
})

export const listGroupedIssuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    resolved: Joi.boolean(),
    archived: Joi.boolean(),

    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),
    category: Joi.string().valid(...Object.values(IssueCategoryEnum)),

    title: Joi.string().max(256),
    'service.serviceNameSlug': Joi.string().max(256),
    'service.environmentSlug': Joi.string().max(256),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),

    // metrics params
    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),

    hash: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(0)),
    componentHash: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(0)),
    customHash: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(0)),
    titleHash: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()).min(0)),

    groupBy: Joi.string().valid(...Object.values(IssueGroupBy)),
  }).required(),
})

export const getIssueByComponentHashSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    componentHash: Joi.string().required(),
  }).required(),
})

export const getIssueByTitleHashSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    titleHash: Joi.string().required(),
  }).required(),
})

export const getIssueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    issueId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }),
})

export const updateIssueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    issueId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    resolved: Joi.boolean(),
    archived: Joi.boolean(),
    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),
  }).required(),
})

export const removeIssueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    issueId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const bulkUpdateIssuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    filter: Joi.object({
      ids: Joi.array().items(Joi.string().hex().length(24)),
      hash: Joi.array().items(Joi.string()),
      componentHash: Joi.array().items(Joi.string()),
      customHash: Joi.array().items(Joi.string()),
      titleHash: Joi.array().items(Joi.string()),
      resolved: Joi.boolean(),
      archived: Joi.boolean(),
      severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),
    }),

    payload: Joi.object({
      resolved: Joi.boolean(),
      archived: Joi.boolean(),
      severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),
      fixabilityScore: Joi.number().integer().min(0).max(100),
    }),
  }).required(),
})

export const bulkRemoveIssuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),

    hash: Joi.array().items(Joi.string()),
    componentHash: Joi.array().items(Joi.string()),
    customHash: Joi.array().items(Joi.string()),
    titleHash: Joi.array().items(Joi.string()),

    resolved: Joi.boolean(),
    archived: Joi.boolean(),
    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),

    title: Joi.string().max(256),
    'service.serviceNameSlug': Joi.string().max(256),
    'service.environmentSlug': Joi.string().max(256),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),
  }).required(),
})

export const listIssuesForEndUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    resolved: Joi.boolean(),
    archived: Joi.boolean(),
    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),

    title: Joi.string().max(256),
    'service.serviceNameSlug': Joi.string().max(256),
    'service.environmentSlug': Joi.string().max(256),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),

    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }).required(),
})

export const listSimilarIssuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    issueId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),

    resolved: Joi.boolean(),
    archived: Joi.boolean(),
    severity: Joi.number().valid(...Object.values(IssueSeverityLevel)),

    title: Joi.string().max(256),
    'service.serviceNameSlug': Joi.string().max(256),
    'service.environmentSlug': Joi.string().max(256),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),
  }),
})

export const listAffectedEndUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    issueId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),

    'attributes.type': Joi.string().valid(...Object.values(EndUserType)),
    'attributes.id': Joi.string(),
    'attributes.name': Joi.string(),
    'attributes.groupId': Joi.string(),
    'attributes.groupName': Joi.string(),
    'attributes.userEmail': Joi.string(),
    'attributes.userId': Joi.string(),
    'attributes.userName': Joi.string(),
    'attributes.accountId': Joi.string(),
    'attributes.accountName': Joi.string(),
    'attributes.orgId': Joi.string(),
    'attributes.orgName': Joi.string(),
    'attributes.environment': Joi.string(),
    'attributes.environmentSlug': Joi.string(),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),

    titleHash: Joi.string(),

    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }),
})

export const listAffectedEndUsersByTitleHashSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    titleHash: Joi.string().required(),
  }).required(),
  query: Joi.object({
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),

    'attributes.type': Joi.string().valid(...Object.values(EndUserType)),
    'attributes.id': Joi.string(),
    'attributes.name': Joi.string(),
    'attributes.groupId': Joi.string(),
    'attributes.groupName': Joi.string(),
    'attributes.userEmail': Joi.string(),
    'attributes.userId': Joi.string(),
    'attributes.userName': Joi.string(),
    'attributes.accountId': Joi.string(),
    'attributes.accountName': Joi.string(),
    'attributes.orgId': Joi.string(),
    'attributes.orgName': Joi.string(),
    'attributes.environment': Joi.string(),
    'attributes.environmentSlug': Joi.string(),

    'lastSeen.gte': Joi.date(),
    'lastSeen.lte': Joi.date(),

    text: Joi.string().max(500),

    titleHash: Joi.string(),

    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }),
})
