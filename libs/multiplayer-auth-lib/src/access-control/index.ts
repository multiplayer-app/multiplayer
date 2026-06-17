import type {
  Request,
  Response,
  NextFunction,
} from 'express'
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleAccountPermissionEntity,
  ErrorMessage,
  FeatureFlag,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'
import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  PaymentRequiredError,
} from 'restify-errors'
import {
  Entity,
  Integration,
  Project,
  ProjectBranch,
  ProjectBranchReview,
  Team,
  TeamMember,
  ProjectMember,
  Thread,
  Comment,
  Workspace,
  WorkspaceMember,
  GitRepository,
  GitRepositoryBranch,
  GitRepositoryCommit,
  GitRepositoryFile,
  GitRepositoryInternal,
  GitRepositoryInternalBranch,
  GitRepositoryInternalCommit,
  GitRepositoryInternalFile,
  Ai,
  Commit,
  EntityCommit,
  ProjectLink,
  GitRefTag,
  Environment,
  VariableSchema,
  VariableValue,
  RadarDetection,
  Release,
  Deployment,
  DebugSession,
  Flows,
  Account,
  Proxy,
  ContinuousDebugSession,
  SessionNote,
  ConditionalRecordingFilters,
  RemoteSessionRecordingSettings,
  Issue,
  EndUser,
  AlertRule,
  IssuesSettings,
  AlertHistory,
  Agent,
  AgentChat,
} from './entities'
import { setAccessContextToReq } from './context'
import type { EntityBase } from './base/entity-base'
import { WorkspaceModel } from '@multiplayer/models'

export const checkFeatureFlag = (featureFlag?: FeatureFlag) => {
  const checkFeatureFlagMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!featureFlag) return next()
      const workspaceId = req.params.workspaceId as string | undefined
      if (!workspaceId) {
        return next(new InternalServerError('Feature flag can be set only for workspace api'))
      }
      const hasAccess = await WorkspaceModel.hasFeatureAccess(
        workspaceId,
        featureFlag,
      )
      if (!hasAccess) {
        return next(new NotFoundError('Endpoint is inaccessible'))
      }
      return next()
    } catch (err) {
      logger.error(err)
      return next(new InternalServerError())
    }
  }

  return checkFeatureFlagMiddleware
}

export const checkPermissions = ({ entity, action, bulk, overrideIdPath }: {
  entity?: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity,
  action?: RoleAccessAction,
  bulk?: boolean,
  overrideIdPath?: string
}) => {
  const checkPermissionsMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (
        !entity
        || !action
        || req.isInternal
      ) {
        logger.debug(
          '[ACCESS] Skipping permissions check',
          {
            entity,
            action,
            isInternal: req.isInternal,
          },
        )
        return next()
      }

      req.bulk = bulk
      req.overrideIdPath = overrideIdPath

      await setAccessContextToReq(req)

      const validationConstructors: {
        [key in RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity]: () => EntityBase
      } = {
        [RoleAccountPermissionEntity.ACCOUNT]: () => new Account(req),
        [RoleWorkspacePermissionEntity.WORKSPACE]: () => new Workspace(req),
        [RoleWorkspacePermissionEntity.WORKSPACE_MEMBER]: () => new WorkspaceMember(req),
        [RoleWorkspacePermissionEntity.PROJECT]: () => new Project(req),
        [RoleWorkspacePermissionEntity.TEAM]: () => new Team(req),
        [RoleWorkspacePermissionEntity.TEAM_MEMBER]: () => new TeamMember(req),
        [RoleWorkspacePermissionEntity.PROJECT_MEMBER]: () => new ProjectMember(req),
        [RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW]: () => new ProjectBranchReview(req),
        [RoleProjectPermissionEntity.PROJECT_BRANCH]: () => new ProjectBranch(req),
        [RoleProjectPermissionEntity.ENTITY]: () => new Entity(req),
        [RoleWorkspacePermissionEntity.INTEGRATION]: () => new Integration(req),
        [RoleProjectPermissionEntity.COMMENT]: () => new Comment(req),
        [RoleProjectPermissionEntity.THREAD]: () => new Thread(req),
        [RoleWorkspacePermissionEntity.GIT_REPOSITORY]: () => new GitRepository(req),
        [RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH]: () => new GitRepositoryBranch(req),
        [RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT]: () => new GitRepositoryCommit(req),
        [RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE]: () => new GitRepositoryFile(req),
        [RoleWorkspacePermissionEntity.AI]: () => new Ai(req),
        [RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL]: () => new GitRepositoryInternal(req),
        [RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH]: () => new GitRepositoryInternalBranch(req),
        [RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT]: () => new GitRepositoryInternalCommit(req),
        [RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE]: () => new GitRepositoryInternalFile(req),
        [RoleProjectPermissionEntity.COMMIT]: () => new Commit(req),
        [RoleProjectPermissionEntity.ENTITY_COMMIT]: () => new EntityCommit(req),
        [RoleProjectPermissionEntity.PROJECT_LINK]: () => new ProjectLink(req),
        [RoleProjectPermissionEntity.GIT_REF_TAG]: () => new GitRefTag(req),
        [RoleProjectPermissionEntity.ENVIRONMENT]: () => new Environment(req),
        [RoleProjectPermissionEntity.VARIABLE_SCHEMA]: () => new VariableSchema(req),
        [RoleProjectPermissionEntity.VARIABLE_VALUE]: () => new VariableValue(req),
        [RoleProjectPermissionEntity.RADAR_DETECTION]: () => new RadarDetection(req),
        [RoleProjectPermissionEntity.RELEASE]: () => new Release(req),
        [RoleProjectPermissionEntity.DEPLOYMENT]: () => new Deployment(req),
        [RoleProjectPermissionEntity.FLOW]: () => new Flows(req),
        [RoleProjectPermissionEntity.PROXY]: () => new Proxy(req),
        [RoleProjectPermissionEntity.DEBUG_SESSION]: () => new DebugSession(req),
        [RoleProjectPermissionEntity.CONTINUOUS_DEBUG_SESSION]: () => new ContinuousDebugSession(req),
        [RoleProjectPermissionEntity.SESSION_NOTES]: () => new SessionNote(req),
        [RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS]: () => new ConditionalRecordingFilters(req),
        [RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS]: () => new RemoteSessionRecordingSettings(req),
        [RoleProjectPermissionEntity.ISSUE]: () => new Issue(req),
        [RoleProjectPermissionEntity.END_USER]: () => new EndUser(req),
        [RoleProjectPermissionEntity.ALERT_RULE]: () => new AlertRule(req),
        [RoleProjectPermissionEntity.ISSUE_SETTINGS]: () => new IssuesSettings(req),
        [RoleProjectPermissionEntity.ALERT_HISTORY]: () => new AlertHistory(req),
        [RoleProjectPermissionEntity.AGENT]: () => new Agent(req),
        [RoleProjectPermissionEntity.AGENT_CHAT]: () => new AgentChat(req),
      }

      const EntityAccessValidator = validationConstructors[entity]

      if (!EntityAccessValidator) {
        logger.error(
          '[ACCESS] Access control handler not found',
          {
            entity,
            action,
            isInternal: req.isInternal,
          },
        )

        throw new InternalServerError()
      }

      const entityAccessValidator = EntityAccessValidator()
      const isAllowed = await entityAccessValidator.ability(action)

      req.access = {
        entity,
        permissions: entityAccessValidator.accessActions,
      }

      if (!isAllowed) {
        throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
      }

      const billingPlanLimitation = await entityAccessValidator.hasBillingPlanLimitation(action)

      if (billingPlanLimitation) {
        req.billingPlanLimitation = billingPlanLimitation
        throw new PaymentRequiredError(ErrorMessage.FEATURE_LIMITED_BY_BILLING_PLAN)
      }

      return next()
    } catch (err) {
      return next(err)
    }
  }
  return checkPermissionsMiddleware
}
