export enum RoleProjectPermissionEntity {
  COMMENT = 'comment',
  THREAD = 'thread',

  GIT_REPOSITORY_INTERNAL = 'gitRepositoryInternal',
  GIT_REPOSITORY_INTERNAL_BRANCH = 'gitRepositoryInternalBranch',
  GIT_REPOSITORY_INTERNAL_COMMIT = 'gitRepositoryInternalCommit',
  GIT_REPOSITORY_INTERNAL_FILE = 'gitRepositoryInternalFile',

  COMMIT = 'commit',
  ENTITY_COMMIT = 'entityCommit',
  ENTITY = 'entity',

  PROJECT_BRANCH_REVIEW = 'projectBranchReview',
  PROJECT_BRANCH = 'projectBranch',

  PROJECT_LINK = 'projectLink',
  GIT_REF_TAG = 'gitRefTag',
  ENVIRONMENT = 'environment',
  VARIABLE_SCHEMA = 'variableSchema',
  VARIABLE_VALUE = 'variableValue',

  RADAR_DETECTION = 'radar-detection',

  RELEASE = 'release',
  DEPLOYMENT = 'deployment',

  DEBUG_SESSION = 'debug-session',
  SESSION_NOTES = 'session-notes',
  CONDITIONAL_RECORDING_FILTERS = 'conditional-recording-filters',
  REMOTE_SESSION_RECORDING_SETTINGS = 'remote-session-recording-settings',
  ISSUE_SETTINGS = 'issue-settings',

  CONTINUOUS_DEBUG_SESSION = 'continuous-debug-session',

  FLOW = 'flow',

  PROXY = 'proxy',

  ISSUE = 'issue',

  END_USER = 'end-user',

  ALERT_RULE = 'alert-rule',
  ALERT_HISTORY = 'alert-history',
  AGENT = 'agent',
  AGENT_CHAT = 'agent-chat',

  INTEGRATION = 'integration',
}
