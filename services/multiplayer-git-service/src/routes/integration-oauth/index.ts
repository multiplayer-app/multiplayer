import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  IntegrationTypeEnum,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  OAuthStateMiddleware,
} from '../../middleware'
import { isProduction } from '../../config'
import { verifySlackWebhookMiddleware } from '../../libs/slack.lib'
import * as bitbucketCallback from './create-bitbucket-callback'
import bitbucketAuth from './create-bitbucket-auth'
// import * as githubCallback from './create-github-callback'
// import githubAuth from './create-github-auth'
import * as gitlabCallback from './create-gitlab-callback'
import gitlabAuth from './create-gitlab-auth'
import atlassianAuth from './create-atlassian-auth'
import * as atlassianCallback from './create-atlassian-callback'
import linearAuth from './create-linear-auth'
import * as linearCallback from './create-linear-callback'
import slackAuth from './create-slack-auth'
import * as slackCallback from './create-slack-callback'
import slackEventHandler from './slack-event-handler'

const { IntegrationOAuthValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/bitbucket/auth').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationOAuthValidationMiddleware.validateCreateBitbucketOAuthIntegrationArgs,
  bitbucketAuth,
)

router.route('/bitbucket/callback').get(
  OAuthStateMiddleware.attachOauthStateSessionPath(IntegrationTypeEnum.BITBUCKET),
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  bitbucketCallback.callback,
  bitbucketCallback.customRedirect,
  bitbucketCallback.callbackErrorHandler,
)

// router.route('/github/auth').get(
//   authorize(),
//   IntegrationOAuthValidationMiddleware.validateCreateGithubOAuthIntegrationArgs,
//   githubAuth,
// )

// router.route('/github/callback').get(
//   authorize(),
//   githubCallback.callback,
//   githubCallback.customRedirect,
//   githubCallback.callbackErrorHandler,
// )

router.route('/gitlab/auth').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationOAuthValidationMiddleware.validateCreateGitlabOAuthIntegrationArgs,
  gitlabAuth,
)

router.route('/gitlab/callback').get(
  OAuthStateMiddleware.attachOauthStateSessionPath(IntegrationTypeEnum.GITLAB),
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  gitlabCallback.callback,
  gitlabCallback.customRedirect,
  gitlabCallback.callbackErrorHandler,
)

router.route('/atlassian/auth').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationOAuthValidationMiddleware.validateCreateAtlassianOAuthIntegrationArgs,
  atlassianAuth,
)

router.route('/atlassian/callback').get(
  OAuthStateMiddleware.attachOauthStateSessionPath(IntegrationTypeEnum.ATLASSIAN),
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  atlassianCallback.callback,
  atlassianCallback.customRedirect,
  atlassianCallback.callbackErrorHandler,
)

router.route('/linear/auth').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationOAuthValidationMiddleware.validateCreateLinearOAuthIntegrationArgs,
  linearAuth,
)

router.route('/linear/callback').get(
  OAuthStateMiddleware.attachOAuthState,
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  linearCallback.callback,
  linearCallback.customRedirect,
  linearCallback.callbackErrorHandler,
)

router.route('/slack/auth').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationOAuthValidationMiddleware.validateCreateSlackOAuthIntegrationArgs,
  slackAuth,
)

router.route('/slack/callback').get(
  OAuthStateMiddleware.attachOAuthState,
  OAuthStateMiddleware.attachOauthStateSessionPath(IntegrationTypeEnum.SLACK),
  isProduction
    ? authorize({
      entity: RoleWorkspacePermissionEntity.INTEGRATION,
      action: RoleAccessAction.CREATE,
    })
    : (req: Request, res: Response, next: NextFunction) => next(),
  slackCallback.callback,
  slackCallback.customRedirect,
  slackCallback.callbackErrorHandler,
)

router.route('/slack/event').post(
  verifySlackWebhookMiddleware,
  slackEventHandler,
)

export default router
