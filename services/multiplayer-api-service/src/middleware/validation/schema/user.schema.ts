import { Joi } from '@multiplayer/util'
import { Timezone } from '@multiplayer/util-shared'

export const listUserSchema = Joi.object({})

export const getCurrentUserSchema = Joi.object({})

export const updateCurrentUserSchema = Joi.object({
  body: Joi.object({
    timezone: Joi.string().custom((value, helper) => {
      if (!Timezone.isValidTimeZone(value)) {

        return helper.message({ custom: 'Invalid timezone.' })
      }

      return true
    }),
  }).required(),
})

export const getCurrentWorkspaceUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateCurrentWorkspaceUserSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    username: Joi.string().regex(/^\S+$/),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/),
    timezone: Joi.string().custom((value, helper) => {
      if (!Timezone.isValidTimeZone(value)) {

        return helper.message({ custom: 'Invalid timezone.' })
      }

      return true
    }),
  }).required(),
})

export const updateCurrentWorkspaceUserIconSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
})
