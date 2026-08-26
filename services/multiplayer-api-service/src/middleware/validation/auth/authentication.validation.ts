import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AuthenticationSchema } from './schema'

export const validateGoogleAuthenticationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { query: req.query }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.googleAuthenticationSchema,
    {},
    next,
  )
}

export const validateGitlabAuthenticationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { query: req.query }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.gitlabAuthenticationSchema,
    {},
    next,
  )
}

export const validateGithubAuthenticationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { query: req.query }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.githubAuthenticationSchema,
    {},
    next,
  )
}

export const validateLocalLoginAuthenticationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.localAuthenticationSchema,
    {},
    next,
  )
}

export const validateLocalRegisterArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.localRegisterSchema,
    {},
    next,
  )
}

export const validateLocalForgotArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.localForgotSchema,
    {},
    next,
  )
}

export const validateLocalSetPasswordArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.localSetPasswordSchema,
    {},
    next,
  )
}

export const validateGetUserAuthTypeArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { query: req.query }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.getUserAuthTypeSchema,
    {},
    next,
  )
}

export const validateConfirmLocalEmailArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.confirmLocalEmailSchema,
    {},
    next,
  )
}

export const validateResendConfirmLocalEmailArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.resendConfirmLocalEmailSchema,
    {},
    next,
  )
}

export const validateUnlinkGitlabAccountArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.unlinkGitlabAccountSchema,
    {},
    next,
  )
}

export const validateUnlinkGithubAccountArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.unlinkGithubAccountSchema,
    {},
    next,
  )
}

export const validateUnlinkGoogleAccountArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.unlinkGoogleAccountSchema,
    {},
    next,
  )
}

export const validateOauthClientRegistration = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.oauthClientRegistrationSchema,
    {},
    next,
  )
}
export const validateTokenExchange = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.tokenExchangeSchema,
    {},
    next,
  )
}

export const validateDeleteToken = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.deleteTokenSchema,
    {},
    next,
  )
}

export const validatePrivateGetOauthClient = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.privateGetOauthClientSchema,
    {},
    next,
  )
}
export const validateGenerateAuthCode = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.generateAuthCodeSchema,
    {},
    next,
  )
}
export const validateGetOauthClient = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.getOauthClientSchema,
    {},
    next,
  )
}

export const validateDeleteOauthClient = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.deleteOauthClientSchema,
    {},
    next,
  )
}

export const validateUpdateOauthClient = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AuthenticationSchema.updateOauthClientSchema,
    {},
    next,
  )
}
