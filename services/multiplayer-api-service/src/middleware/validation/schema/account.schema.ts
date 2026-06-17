import { Joi } from '@multiplayer/util'

export const getAccountSchema = Joi.object({
  params: Joi.object({
    accountId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getAccountRolesSchema = Joi.object({
  params: Joi.object({
    accountId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getAccountBillingCustomerPortalSchema = Joi.object({
  params: Joi.object({
    accountId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getAccountRoleSchema = Joi.object({
  params: Joi.object({
    accountId: Joi.string().hex().length(24).required(),
  }).required(),
})
