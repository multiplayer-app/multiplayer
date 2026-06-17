import { Joi } from '@multiplayer/util'
import { MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH } from '@multiplayer-app/session-recorder-node'
import { endUserAttributesSchema } from './shared/end-user.schema'

export const startDebugSessionFromErrorSpanSchema = Joi.object({
  params: Joi.object({}).required(),
  body: Joi.object({
    workspace: Joi.string().hex().length(24),
    project: Joi.string().hex().length(24),
    span: Joi.object({
      _spanContext: Joi.any(),
      traceId: Joi.any().required(),
      spanId: Joi.any().required(),
      name: Joi.any().required(),
      kind: Joi.any().required(),
      links: Joi.any(),
      ended: Joi.any(),
      events: Joi.any(),
      status: Joi.any().required(),
      endTime: Joi.any(),
      startTime: Joi.any(),
      duration: Joi.any(),
      attributes: Joi.any(),
      parentSpanId: Joi.any(),
      droppedAttributesCount: Joi.any(),
      droppedEventsCount: Joi.any(),
      droppedLinksCount: Joi.any(),
      resource: Joi.any(),
      instrumentationScope: Joi.any(),
    }).required(),
  }).required(),
})

export const startDebugSessionSchema = Joi.object({
  params: Joi.object({}).required(),
  body: Joi.object({
    name: Joi.string(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    sessionAttributes: Joi.object().keys({}).unknown(true),
    resourceAttributes: Joi.object().keys({}).unknown(true),
    userAttributes: Joi.alternatives(
      endUserAttributesSchema,
      Joi.allow(null),
    ),
    workspace: Joi.string().hex().length(24),
    project: Joi.string().hex().length(24),

    // backwards compatibility
    metadata: Joi.object().keys({}).unknown(true),
    clientMetadata: Joi.object().keys({}).unknown(true),
    userMetadata: Joi.object({
      email: Joi.string().email(),
      notifyOnUpdates: Joi.bool(),
      comment: Joi.string(),
    }),
  }).required(),
})

export const updateDebugSessionSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    sessionAttributes: Joi.object().keys({}).unknown(true),
    resourceAttributes: Joi.object().keys({}).unknown(true),
    userAttributes: Joi.alternatives(
      endUserAttributesSchema,
      Joi.allow(null),
    ),
    startedAt: Joi.date(),
    stoppedAt: Joi.date(),
  })
    .with('startedAt', 'stoppedAt')
    .with('stoppedAt', 'startedAt')
    .required(),
})

export const stopDebugSessionSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
  body: Joi.object({
    sessionAttributes: Joi.object().keys({}).unknown(true),
    stoppedAt: Joi.date(),

    // for backwards compatibility
    metadata: Joi.object().keys({}).unknown(true),
    userMetadata: Joi.object({
      email: Joi.string().email(),
      notifyOnUpdates: Joi.bool(),
      comment: Joi.string().allow(''),
    }),
  }).required(),
})

export const cancelDebugSessionSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
  body: Joi.object({}).required(),
})

export const getDebugSessionSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
})

export const createDebugSessionRrwebEventsSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
  body: Joi.object({
    events: Joi.array().items(
      Joi.object({
        event: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
        eventType: Joi.number(),
        timestamp: Joi.number(),
      }),
    ),
  }).required(),
})

export const createDebugSessionRrwebS3FileSchema = Joi.object({
  params: Joi.object({
    debugSessionId: Joi.alternatives(
      Joi.string().hex().length(24).required(),
      Joi.string().hex().length(16).required(),
      Joi.string().hex().length(MULTIPLAYER_TRACE_DEBUG_SESSION_SHORT_ID_LENGTH).required(),
    ).required(),
  }).required(),
  body: Joi.object({}).required(),
})
