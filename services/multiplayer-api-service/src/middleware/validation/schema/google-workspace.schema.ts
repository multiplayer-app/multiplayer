import { Joi } from '@multiplayer/util'
import {
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
} from '../../../config'

export const authGoogleWorkspaceSchema = Joi.object({
  query: Joi.object({
    redirectUrl: Joi.string().uri().max(1000),
    workspace: Joi.string().hex().length(24).required(),
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

export const listGoogleWorkspaceUsersSchema = Joi.object({
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
  }).required(),
}).required()
