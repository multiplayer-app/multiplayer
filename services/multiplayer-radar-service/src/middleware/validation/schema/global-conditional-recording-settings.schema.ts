import { Joi } from '@multiplayer/util'
import { sessionRecordingOptionsSchema } from './shared/session-recording-options'

export const getGlobalConditionalRecordingSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateGlobalConditionalRecordingSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    enabled: Joi.boolean(),
    samplingRate: Joi.number().min(0).max(1),
    maxRemoteSessionRecordings: Joi.number().min(1),
    recordingOptions: sessionRecordingOptionsSchema,

    startConditions: Joi.object({
      startOnError: Joi.boolean(),
    }),
    stopConditions: Joi.object({
      idleTime: Joi.number().min(0),
      maxTime: Joi.number().min(0),
    }),
  }).required(),
})
