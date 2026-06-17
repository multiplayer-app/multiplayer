import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import { RoleModel } from '@multiplayer/models'
import {
  RoleType,
  RoleAccessAction,
  RoleAccountPermissionEntity,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import logger from '@multiplayer/logger'

export const accountRoles = [{
  name: 'Account Role',
  type: RoleType.ACCOUNT,
  permissions: [{
    entity: RoleAccountPermissionEntity.ACCOUNT,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.CREATE,
      RoleAccessAction.BILLING_READ,
      RoleAccessAction.BILLING_UPDATE,
      RoleAccessAction.UPDATE_ACCESS,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.CREATE,
      RoleAccessAction.BILLING_READ,
      RoleAccessAction.BILLING_UPDATE,
      RoleAccessAction.UPDATE_ACCESS,
    ],
  }],
}]

export const workspaceRoles = [{
  name: 'Owner',
  workspaceOwner: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.BILLING_READ,
      RoleAccessAction.BILLING_UPDATE,
      RoleAccessAction.UPDATE_ACCESS,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.UPDATE_ACCESS,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}, {
  name: 'Admin',
  workspaceAdmin: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }],
}, {
  name: 'View only',
  default: true,
  readOnly: true,
  type: RoleType.WORKSPACE,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.READ,
    ],
  }],
}, {
  name: 'Member',
  type: RoleType.WORKSPACE,
  default: false,
  permissions: [{
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.PROJECT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.AI,
    access: [
      RoleAccessAction.CREATE,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    access: [
      RoleAccessAction.READ,
    ],
  }],
}]

export const projectRoles = [{
  name: 'Admin',
  teamAdmin: true,
  type: RoleType.PROJECT,
  permissions: [{
    entity: RoleProjectPermissionEntity.PROXY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleWorkspacePermissionEntity.TEAM,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RELEASE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.CONTINUOUS_DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.FLOW,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ISSUE,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.END_USER,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }],
}, {
  name: 'Member',
  default: true,
  type: RoleType.PROJECT,
  permissions: [{
    entity: RoleProjectPermissionEntity.PROXY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RELEASE,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    access: [
      RoleAccessAction.CREATE,
      RoleAccessAction.DELETE,
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.CONTINUOUS_DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.FLOW,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ISSUE,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.END_USER,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
      RoleAccessAction.DELETE,
    ],
  }],
}, {
  name: 'View only',
  type: RoleType.PROJECT,
  readOnly: true,
  permissions: [{
    entity: RoleProjectPermissionEntity.PROXY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMIT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RELEASE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEPLOYMENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.FLOW,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.ISSUE,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.END_USER,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.AGENT_CHAT,
    access: [
      RoleAccessAction.READ,
    ],
  }],
}]

export const shareRoles = [{
  name: 'View-only',
  type: RoleType.PUBLIC_SHARE,
  default: true,
  readOnly: true,
  permissions: [{
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  },
  {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
    ],
  }],
}, {
  name: 'Comment',
  type: RoleType.PUBLIC_SHARE,
  permissions: [{
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.THREAD,
    access: [
      RoleAccessAction.READ,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  },
  {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
    ],
  }],
}, {
  name: 'Edit',
  type: RoleType.PUBLIC_SHARE,
  permissions: [{
    entity: RoleProjectPermissionEntity.ENTITY,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.UPDATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.COMMENT,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
    ],
  }, {
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    access: [
      RoleAccessAction.READ,
    ],
  },
  {
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    access: [
      RoleAccessAction.READ,
      RoleAccessAction.CREATE,
      RoleAccessAction.UPDATE,
    ],
  }],
}]

const main = async () => {
  await mongo.connect()

  const allRoles = await RoleModel.find({})

  const newRoles = [
    ...accountRoles,
    ...workspaceRoles,
    ...projectRoles,
    ...shareRoles,
  ]

  const { rolesToUpdate, rolesToCreate } = newRoles.reduce((acc, role) => {
    const found = allRoles.find(_role => _role.type === role.type && _role.name === role.name)
    if (found) {
      acc.rolesToUpdate.push(RoleModel.updateOne({
        _id: found._id,
      }, {
        $set: role,
      }).then(() => {
        logger.info('Updated role', {
          _id: found._id,
          name: role.name,
          type: role.type,
        })
      }))
    } else {
      acc.rolesToCreate.push(RoleModel.create(role).then(() => {
        logger.info('Created role', {
          name: role.name,
          type: role.type,
        })
      }))
    }
    return acc
  }, { rolesToUpdate: [] as Promise<any>[], rolesToCreate: [] as Promise<any>[] })

  await Promise.all(rolesToUpdate)
  await Promise.all(rolesToCreate)

  await mongo.disconnect()
}

main()
