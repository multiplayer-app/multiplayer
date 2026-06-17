import { Joi } from '@multiplayer/util'
import { URL } from 'node:url'
import {
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
} from '../../../config'
import { OauthTokenType, RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'

export const googleAuthenticationSchema = Joi.object({
  query: Joi.object({
    refUser: Joi.string().hex().length(24),
    redirectUrl: Joi.string().uri().max(1000),
    linkToUserId: Joi.string().hex().length(24),
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

export const gitlabAuthenticationSchema = Joi.object({
  query: Joi.object({
    refUser: Joi.string().hex().length(24),
    redirectUrl: Joi.string().uri().max(1000),
    linkToUserId: Joi.string().hex().length(24),
    productId: Joi.string().hex().length(24),
    planId: Joi.string().hex().length(24),
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

export const githubAuthenticationSchema = Joi.object({
  query: Joi.object({
    refUser: Joi.string().hex().length(24),
    redirectUrl: Joi.string().uri().max(1000),
    linkToUserId: Joi.string().hex().length(24),
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

export const localAuthenticationSchema = Joi.object({
  body: Joi.object().keys({
    email: Joi.string().lowercase().email().required(),
    password: Joi.string().min(1).required(),
  }),
})

export const localRegisterSchema = Joi.object({
  body: Joi.object().keys({
    refUser: Joi.string().hex().length(24),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().regex(/^\S+$/),
    email: Joi.string().lowercase().email().required(),
    password: Joi.string().min(12).max(100).required(),
  }),
})

export const localForgotSchema = Joi.object({
  body: Joi.object().keys({
    email: Joi.string().email().lowercase().required(),
  }),
})

export const localSetPasswordSchema = Joi.object({
  body: Joi.object().keys({
    token: Joi.string().required(),
    password: Joi.string().min(12).required(),
  }),
})

export const getUserAuthTypeSchema = Joi.object({
  query: Joi.object().keys({
    email: Joi.string().lowercase().email().required(),
  }),
})

export const confirmLocalEmailSchema = Joi.object({
  body: Joi.object().keys({
    token: Joi.string().required(),
  }),
})

export const resendConfirmLocalEmailSchema = Joi.object({
  body: Joi.object().keys({
    email: Joi.string().lowercase().email().required(),
  }),
})

export const unlinkGithubAccountSchema = Joi.object({
  query: Joi.object({}).required(),
  body: Joi.object().keys({}).required(),
})


export const unlinkGitlabAccountSchema = Joi.object({
  query: Joi.object({}).required(),
  body: Joi.object().keys({}).required(),
})

export const unlinkGoogleAccountSchema = Joi.object({
  query: Joi.object({}).required(),
  body: Joi.object().keys({}).required(),
})

export const oauthClientRegistrationSchema = Joi.object({
  body: Joi.object({
    redirect_uris: Joi.array().items(Joi.string().uri()).required(),
    client_name: Joi.string().required(),
    client_uri: Joi.string().uri(),
    token_endpoint_auth_method: Joi.string(),
    logo_uri: Joi.string().uri(),
    scope: Joi.string(),
    grant_types: Joi.array().items(Joi.string()),
    response_types: Joi.array().items(Joi.string()),
  }).required().unknown(true),
})

export const deleteTokenSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
  }).required().unknown(true),
})

export const tokenExchangeSchema = Joi.object({
  body: Joi.object({
    grant_type: Joi.string().valid('authorization_code', 'refresh_token').required(),

    // Fields for authorization_code flow
    code: Joi.string().when('grant_type', {
      is: 'authorization_code',
      then: Joi.required(),
    }),
    redirect_uri: Joi.string().uri().when('grant_type', {
      is: 'authorization_code',
      then: Joi.required(),
    }),
    code_verifier: Joi.string().when('grant_type', {
      is: 'authorization_code',
      then: Joi.required(),
    }),
    client_id: Joi.string().when('grant_type', {
      is: 'authorization_code',
      then: Joi.required(),
    }),

    // Field for refresh_token flow
    refresh_token: Joi.string().when('grant_type', {
      is: 'refresh_token',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }).required().unknown(true),
})
export const getOauthClientSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.string().hex().length(24).required(),
  }).required(),
})
export const privateGetOauthClientSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    redirect_uri: Joi.string().uri().required(),
    response_type: Joi.string().required(),
  }).required(),
})

export const generateAuthCodeSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    codeChallenge: Joi.string().required(),
    codeChallengeMethod: Joi.string().required(),
    redirectUri: Joi.string().uri().required(),
    scope: Joi.object().pattern(
      Joi.string().valid(...Object.values(RoleProjectPermissionEntity)),
      Joi.array().items(Joi.string().valid(...Object.values(RoleAccessAction))),
    ).when('tokenType', { is: OauthTokenType.PROJECT, then: Joi.required() }),
    tokenType: Joi.string().valid(...Object.values(OauthTokenType)).required(),
    workspaceId: Joi.string().hex().length(24)
      .when('tokenType', { is: OauthTokenType.PROJECT, then: Joi.required(), otherwise: Joi.forbidden() }),
    projectId: Joi.string().hex().length(24)
      .when('tokenType', { is: OauthTokenType.PROJECT, then: Joi.required(), otherwise: Joi.forbidden() }),
  }).required(),
})

export const deleteOauthClientSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.string().hex().length(24).required(),
  }).required(),
})
export const updateOauthClientSchema = Joi.object({
  params: Joi.object({
    clientId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    client_id: Joi.string().required(),
    redirect_uris: Joi.array().items(Joi.string().uri()),
    client_name: Joi.string(),
    client_uri: Joi.string().uri(),
    logo_uri: Joi.string().uri(),
    grant_types: Joi.array().items(Joi.string()),
    response_types: Joi.array().items(Joi.string()),
  }).required(),
})

