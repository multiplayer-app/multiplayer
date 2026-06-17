import { Joi } from '@multiplayer/util'
import { RoleType } from '@multiplayer/types'

export const listRolesSchema = Joi.object({
  query: Joi.object({
    hidden: Joi.boolean(),
    type: Joi.string().valid(...Object.keys(RoleType)),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getRoleSchema = Joi.object({
  params: Joi.object({
    roleId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    workspace: Joi.string().hex().length(24),
  }),
})
