import { Joi } from '@multiplayer/util'
import {
  SessionRecordingMode,
  RemoteSessionRecordingConditionCompareOperator,
} from '@multiplayer/types'
import { sessionRecordingOptionsSchema } from './shared/session-recording-options'

export const listConditionalRecordingFiltersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    enabled: Joi.boolean(),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})

export const createConditionalRecordingFiltersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(1000),

    enabled: Joi.boolean(),

    samplingRate: Joi.number().min(0).max(1).required(),
    mode: Joi.string().valid(...Object.values(SessionRecordingMode)).required(),

    conditions: {
      start: Joi.array().items(Joi.object({
        attributePath: Joi.string().regex(/^(session\.attributes|session\.resource\.attributes|session\.user\.attributes)\./).required(),
        value: Joi.string().when('conditionType', {
          is: Joi.valid(
            RemoteSessionRecordingConditionCompareOperator.EXISTS,
            RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS,
          ),
          then: Joi.forbidden(),
          otherwise: Joi.required(),
        }),
        conditionType: Joi.string().valid(...Object.values(RemoteSessionRecordingConditionCompareOperator)).required(),
      })),

      stop: Joi.object({
        idleTime: Joi.number().min(0),
        maxTime: Joi.number().min(0),
      }).required(), // .oxor('idleTime', 'maxTime')
    },

    recordingOptions: sessionRecordingOptionsSchema,
  }).required(),
})

export const updateConditionalRecordingFiltersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    conditionalRecordingFiltersId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(1000),

    enabled: Joi.boolean(),

    samplingRate: Joi.number().min(0).max(1).required(),
    mode: Joi.string().valid(...Object.values(SessionRecordingMode)).required(),

    conditions: {
      start: Joi.array().items(Joi.object({
        attributePath: Joi.string().regex(/^(session\.attributes|session\.resource\.attributes|session\.user\.attributes)\./).required(),
        value: Joi.string().required(),
        conditionType: Joi.string().valid(...Object.values(RemoteSessionRecordingConditionCompareOperator)).required(),
      })),

      stop: Joi.object({
        idleTime: Joi.number().min(0),
        maxTime: Joi.number().min(0),
      }).required(), // .oxor('idleTime', 'maxTime')
    },

    recordingOptions: sessionRecordingOptionsSchema,
  }).required(),
})

export const removeConditionalRecordingFiltersSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    conditionalRecordingFiltersId: Joi.string().hex().length(24).required(),
  }).required(),
})
