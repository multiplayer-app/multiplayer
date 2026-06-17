import { Joi } from '@multiplayer/util'
import { endUserAttributesSchema } from './shared/end-user.schema'

export const startContinuousDebugSessionSchema = Joi.object({
  // params: Joi.object({}).required(),
  body: Joi.object({
    workspace: Joi.string().hex().length(24),
    project: Joi.string().hex().length(24),
    debugSessionData: Joi.object({
      name: Joi.string(),
      sessionAttributes: Joi.object().keys({}).unknown(true),
      resourceAttributes: Joi.object().keys({}).unknown(true),
      userAttributes: Joi.alternatives(
        endUserAttributesSchema,
        Joi.allow(null),
      ),
      tags: Joi.array().items(Joi.string()),
      stoppedAt: Joi.date(),

      // backwards compatibility
      metadata: Joi.object().keys({}).unknown(true),
      clientMetadata: Joi.object().keys({}).unknown(true),
      feedbackMetadata: Joi.object({
        email: Joi.string().email(),
        notifyOnUpdates: Joi.bool(),
        comment: Joi.string(),
      }),
    }),
  }).required(),
})

export const cancelContinuousDebugSessionSchema = Joi.object({
  params: Joi.object({
    continuousDebugSessionId: Joi.string().required(),
  }).required(),
  body: Joi.object({}).required(),
})

export const getContinuousDebugSessionSchema = Joi.object({
  params: Joi.object({
    continuousDebugSessionId: Joi.string().required(),
  }).required(),
})

export const saveContinuousDebugSessionSchema = Joi.object({
  params: Joi.object({
    continuousDebugSessionId: Joi.string().required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    sessionAttributes: Joi.object().keys({}).unknown(true),
    resourceAttributes: Joi.object().keys({}).unknown(true),
    tags: Joi.array().items(Joi.string()),
    stoppedAt: Joi.date(),

    // backwards compatibility
    metadata: Joi.object().keys({}).unknown(true),
    clientMetadata: Joi.object().keys({}).unknown(true),
    userMetadata: Joi.object().keys({}).unknown(true),
    feedbackMetadata: Joi.object({
      email: Joi.string().email(),
      notifyOnUpdates: Joi.bool(),
      comment: Joi.string(),
    }),
  }).required(),
})
