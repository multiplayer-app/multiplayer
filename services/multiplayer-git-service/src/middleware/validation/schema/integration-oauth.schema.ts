import { Joi } from '@multiplayer/util'
import {
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
} from '../../../config'

export const createBitbucketOAuthIntegrationSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    redirectUrl: Joi.string().uri().max(1000),
  })
    .custom((value, helpers) => {
      const { redirectUrl } = value

      if (!redirectUrl?.length) {
        return value
      }

      const parsedUrl = new URL(redirectUrl)

      if (
        parsedUrl.hostname !== FRONTEND_DOMAIN
        || parsedUrl.protocol !== `${FRONTEND_PROTOCOL}:`
      ) {
        return helpers.message({
          custom: 'Not valid redirect url',
        })
      }

      return value
    })
    .required(),
})

export const createGitlabOAuthIntegrationSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    redirectUrl: Joi.string().uri().max(1000),
  })
    .custom((value, helpers) => {
      const { redirectUrl } = value

      if (!redirectUrl?.length) {
        return value
      }

      const parsedUrl = new URL(redirectUrl)

      if (
        parsedUrl.hostname !== FRONTEND_DOMAIN
        || parsedUrl.protocol !== `${FRONTEND_PROTOCOL}:`
      ) {
        return helpers.message({
          custom: 'Not valid redirect url',
        })
      }

      return value
    })
    .required(),
})

export const createGithubOAuthIntegrationSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    redirectUrl: Joi.string().uri().max(1000),
  })
    .custom((value, helpers) => {
      const { redirectUrl } = value

      if (!redirectUrl?.length) {
        return value
      }

      const parsedUrl = new URL(redirectUrl)

      if (
        parsedUrl.hostname !== FRONTEND_DOMAIN
        || parsedUrl.protocol !== `${FRONTEND_PROTOCOL}:`
      ) {
        return helpers.message({
          custom: 'Not valid redirect url',
        })
      }

      return value
    })
    .required(),
})

export const createSlackOAuthIntegrationSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
    redirectUrl: Joi.string().uri().max(1000),
  })
    .custom((value, helpers) => {
      const { redirectUrl } = value

      if (!redirectUrl?.length) {
        return value
      }

      const parsedUrl = new URL(redirectUrl)

      if (
        parsedUrl.hostname !== FRONTEND_DOMAIN
        || parsedUrl.protocol !== `${FRONTEND_PROTOCOL}:`
      ) {
        return helpers.message({
          custom: 'Not valid redirect url',
        })
      }

      return value
    })
    .required(),
})
