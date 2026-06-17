import { Joi } from '@multiplayer/util'
import {
  DebugSessionCreationReasonType,
  Notebook,
} from '@multiplayer/types'

export const listDebugSessionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    name: Joi.string(),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    startedAfterTimestamp: Joi.number().min(0),
    startedBeforeTimestamp: Joi.number().min(0),
    maxDurationInSeconds: Joi.number().min(0),
    minDurationInSeconds: Joi.number().min(0),
    starred: Joi.boolean(),
    hasStarredItems: Joi.boolean(),
    creationReason: Joi.alternatives().try(
      Joi.string().valid(...Object.values(DebugSessionCreationReasonType)),
      Joi.array().items(Joi.string().valid(...Object.values(DebugSessionCreationReasonType))).min(1),
    ),
    continuousDebugSession: Joi.string().alphanum(),
    fromContinuousDebugSession: Joi.boolean(),
    live: Joi.boolean(),
    issueHash: Joi.string(),
    issueTitleHash: Joi.string(),
    issueComponentHash: Joi.string(),
    issueCustomHash: Joi.string(),
    endUserHash: Joi.string(),

    'createdAt.gte': Joi.date(),
    'createdAt.lte': Joi.date(),
  })
    .pattern(/sessionAttributes\./, Joi.string())
    .pattern(/resourceAttributes\./, Joi.string())
    .pattern(/userAttributes\./, Joi.string())
    .oxor('continuousDebugSession', 'fromContinuousDebugSession')
    .required(),
})

export const getDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    auth: Joi.string().valid(...Object.values(Notebook.AuthSchemaType)).optional(),
  }).optional(),
})

export const removeDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    sessionAttributes: Joi.object().keys({}).unknown(true),
    views: Joi.array().items(Joi.object({
      name: Joi.string(),
      components: Joi.array().items(Joi.string()),
    })),
    starred: Joi.boolean(),
    starredItems: Joi.array().items(Joi.string()),
  }).required(),
})

export const addStarToDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    starId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const removeStarFromDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    starId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const addViewToDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    components: Joi.array().items(Joi.string()),
  }).required(),
})

export const updateDebugSessionViewSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
    viewId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    components: Joi.array().items(Joi.string()),
  }).required(),
})

export const removeViewFromDebugSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
    viewId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const bulkDeleteDebugSessionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
    issueHash: Joi.string(),
    issueTitleHash: Joi.string(),
    issueComponentHash: Joi.string(),
    issueCustomHash: Joi.string(),

    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    starred: Joi.boolean(),
    creationReason: Joi.alternatives().try(
      Joi.string().valid(...Object.values(DebugSessionCreationReasonType)),
      Joi.array().items(Joi.string().valid(...Object.values(DebugSessionCreationReasonType))).min(1),
    ),
    fromContinuousDebugSession: Joi.boolean(),
  }).required(),
})
