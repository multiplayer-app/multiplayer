import { Joi } from '@multiplayer/util'
import {
  EndUserType,
  SessionRecordingNextRecordType,
} from '@multiplayer/types'
import { MetricsGranularity } from '../../../types'
import { sessionRecordingOptionsSchema } from './shared/session-recording-options'

export const listEndUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),

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
    online: Joi.boolean(),

    endUserHash: Joi.string(),

    text: Joi.string().max(256),

    // metrics params
    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }).required(),
})

export const getEndUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    'metrics.from': Joi.date().iso(),
    'metrics.to': Joi.date().iso(),
    'metrics.granularity': Joi.string().valid(...Object.values(MetricsGranularity)),
  }).required(),
})

export const updateEndUserSessionRecordingSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    recordingOptions: sessionRecordingOptionsSchema,
    whenToRecord: Joi.string().valid(...Object.values(SessionRecordingNextRecordType)),
    sessionRecordingsLimit: Joi.number().integer().min(0),
  }).required(),
})

export const bulkUpdateEndUserSessionRecordingSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
    recordingOptions: sessionRecordingOptionsSchema,
    whenToRecord: Joi.string().valid(...Object.values(SessionRecordingNextRecordType)),
    sessionRecordingsLimit: Joi.number().integer().min(0),
  }).required(),
})

export const removeEndUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const bulkRemoveEndUsersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
  }).required(),
})

export const startRemoteSessionRecordingSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    socketId: Joi.string(),
  }).required(),
})

export const stopRemoteSessionRecordingSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    endUserId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    socketId: Joi.string(),
  }).required(),
})

export const bulkStartRemoteSessionRecordingSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
  }).required(),
})

export const bulkStopRemoteSessionRecordingSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
  }).required(),
})
