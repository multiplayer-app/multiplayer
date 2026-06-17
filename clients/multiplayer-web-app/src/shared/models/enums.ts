export enum ShortcutTypes {
  copy = "copy",
  cut = "cut",
  undo = "undo",
  redo = "redo",
  select_all = "select_all",
  delete = "delete",
  save = "save",
  esc = "esc",
  group = "group",
  ungroup = "ungroup",
  tool_select = "tool_select",
  tool_hand = "tool_hand",
}

export enum NodeTypes {
  genericNode = "generic",
  clientNode = "client",
  serviceNode = "service",
  platformNode = "platform",
}

export enum UserRoles {
  OWNER = "Owner",
  ADMIN = "Admin",
  USER_READONLY = "User ReadOnly",
  USER_READWRITE = "User ReadWrite",
}

export enum ConnectionStatus {
  disconnected = "disconnected",
  connected = "connected",
  connecting = "connecting",
  failed = "failed",
  destroyed = "destroyed",
}

export enum EntityCategories {
  PLATFORM = "platform",
  COMPONENT = "component",
  DOCUMENT = "document",
  SKETCH = "sketch",
  REPOSITORY = "repository",
  ENVIRONMENT = "environment",
  SCHEMA = "schema",
  SOURCE = "source",
  VARIABLE_GROUP = "variable_group",
}

export enum EntityFormFieldType {
  TEXT = "text",
  RADIO = "radio",
  HIDDEN = "hidden",
  REPO = "repo",
  DROPDOWN = "dropdown",
}

export enum IntegrationType {
  GITLAB = "gitlab",
  GITHUB = "github",
  BITBUCKET = "bitbucket",
  RADAR = "radar",
  SLACK = "slack",
}

export enum ProjectSourceType {
  ALL = "all",
  FILE = "file",
  RADAR = "radar",
  FLOWS = "flows",
  AGENTS = "agents",
  ISSUES = "issues",
  END_USERS = "users",
  ENTITY = "entity",
  DEBUGGER = "debugger",
  REPOSITORY = "repository",
  SETTINGS = "settings",
}

export enum GitObjectType {
  FILE = "file",
  DIRECTORY = "directory",
}

export enum EntityStateStatus {
  WAITING = "waiting",
  FETCHING = "fetching",
  FETCHED = "fetched",
  PATCHING = "patching",
  PATCHED = "patched",
  FAILED = "failed",
}
export enum StageStatus {
  UNSTAGED = 0,
  INDETERMINATE = 1,
  STAGED = 2,
}

export enum Endpoint {
  SOURCE = "source",
  TARGET = "target",
}

export enum PlatformChangeObject {
  COMPONENT = "component",
  EDGE = "edge",
  VIEW = "view",
}

export enum SystemViewTypes {
  ALL = "_all",
  DIFFS = "_diffs",
  CHANGES = "_changes",
}

export enum ChangesViewMode {
  NONE = "none",
  CHANGES = "changes",
  XRAY = "xray",
}

export enum SocketErrorCodes {
  UNAUTHORIZED = 401,
  ENTITY_NOT_FOUND = 404,
  ENTITY_REMOVED = 405,
}

export enum Steps {
  team = "team",
  member = "member",
  workspace = "workspace",
}

export enum OrganizationUnit {
  Team = "team",
  Workspace = "workspace",
}

export enum GitSourceType {
  CODE = "code",
  IMAGE = "image",
  VIDEO = "video",
}

export enum tlDrawEventTypes {
  COMMENT_TOOL_SELECTED = "commentToolSelected",
}

export enum PostHogEvents {
  SIGN_UP = "Sign up",
  SIGN_IN = "Sign in",
  ACCEPT_INVITATION = "Accept invitation",
  SETUP_RADAR = "Setup Radar",
  REMOVE_RADAR_INTEGRATION = "Remove Radar integration",
  CREATE_SESSION_RECORDING = "Create session recording",
  DELETE_SESSION_RECORDING = "Delete session recording",
  DELETE_PROJECT = "Delete Project",
  DELETE_TEAM = "Delete Team",
  DELETE_BRANCH = "Delete Branch",
  DELETE_ENTITY = "Delete Entity",
  ADD_COMPONENT_TO_PLATFORM = "Add component to Platform",
  ADD_DRAWING_TO_SKETCH = "Add drawing to sketch",
  UPDATE_NOTEBOOK = "Update notebook",
  SUPPORT_REQUEST = "Support request",
  CREATE_WORKSPACE = "Create Workspace",
  DELETE_WORKSPACE = "Delete Workspace",
  CREATE_PROJECT = "Create Project",
  CREATE_TEAM = "Create Team",
  CREATE_BRANCH = "Create Branch",
  CREATE_PLATFORM = "Create Platform",
  INVITE_USERS = "Invite Users",
  DELETE_TEAM_MEMBER = "Delete Team Member",
  DELETE_WORKSPACE_MEMBER = "Delete Workspace Member",
  LEAVE_WORKSPACE = "Leave Workspace",
  CONNECT_REPO_TO_PROJECT = "Connect repository to projects",
  CONNECT_TO_PUBLIC_REPO = "Connect to a public repo",
  SUBMITTED_DESIGN_REVIEW = "Submitted System Design Review",
  USER_CLICKED_TO_DEMO_LINK = "User clicked to contact us for a demo",
  USER_CHECKED_PRO_PLAN_BENEFITS = "User checked pro plan benefits on pricing page",
  USER_CLOSED_PRO_FEATURE_POPUP = "User closed pro feature pop up",
  USER_REMAINED_ON_FREE_PLAN = "User remained on the free plan after trial expiration",
  ONBOARDING_WIZARD_MANUALLY_OPENED = "User opened onboarding wizard manually",
  ONBOARDING_WIZARD_OPENED = "Onboarding Wizard opened",
  ONBOARDING_WIZARD_CLOSED = "Onboarding Wizard closed",
  ONBOARDING_WIZARD_GET_STARTED_CLICKED = "Onboarding Wizard Get Started clicked",
  ONBOARDING_WIZARD_STEP_VIEWED = "Onboarding Wizard step viewed",
  ONBOARDING_WIZARD_STEP_COMPLETED = "Onboarding Wizard step completed",
  ONBOARDING_WIZARD_STEP_SKIPPED = "Onboarding Wizard step skipped",
  ONBOARDING_WIZARD_COMPLETED_ALL_STEPS = "Onboarding Wizard completed all steps",
  ONBOARDING_WIZARD_EXITED_EARLY = "Onboarding Wizard exited early",
  ONBOARDING_WIZARD_API_KEY_GENERATED = "Onboarding Wizard API key generated",
  ONBOARDING_WIZARD_CLIENT_METHOD_SELECTED = "Onboarding Wizard client method selected",
  ONBOARDING_WIZARD_BACKEND_STEP_SELECTED = "Onboarding Wizard backend step selected",
  ONBOARDING_WIZARD_MCP_IDE_SELECTED = "Onboarding Wizard MCP IDE selected",
  ONBOARDING_WIZARD_MCP_INSTALL_CLICKED = "Onboarding Wizard MCP install clicked",
  ONBOARDING_WIZARD_DOCS_LINK_CLICKED = "Onboarding Wizard docs link clicked",
  ONBOARDING_WIZARD_CONTACT_US_CLICKED = "Onboarding Wizard Contact Us clicked",
  ONBOARDING_WIZARD_SUCCESS_CLOSE_CLICKED = "Onboarding Wizard success close clicked",
  END_USERS_DELETED = "User deleted end users",
  SANDBOX_TOUR_OPENED = "Sandbox Tour opened",
  SANDBOX_TOUR_CLOSED = "Sandbox Tour closed",
  SANDBOX_TOUR_STEP_VIEWED = "Sandbox Tour step viewed",
  SANDBOX_TOUR_STEP_COMPLETED = "Sandbox Tour step completed",
  SANDBOX_TOUR_EXITED_EARLY = "Sandbox Tour exited early",
}

export enum ComponentTypeEnum {
  GENERIC = "GENERIC",
  CLIENT = "CLIENT",
  SERVICE = "SERVICE",
  PLATFORM = "PLATFORM",
}

export enum SystemCatalogTabTypes {
  Components = "Components",
  APIs = "APIs",
  Platforms = "Platforms",
  Dependencies = "Dependencies",
  Environments = "Environments",
  Flows = "Flows",
}

export enum SortingDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export const SortingDirectionMap = {
  [SortingDirection.ASC]: "1",
  [SortingDirection.DESC]: "-1",
};

export enum OnboardingStateEnum {
  WorkspaceSetup = 1,
  ProjectSetup = 2,
  Done = 3,
}

export enum SubscriptionType {
  free = "free",
  teams = "teams",
  enterprise = "enterprise",
}

export enum UserActions {
  SETUP_DEBUGGER,
  RECORD_SESSION,
  UPDATE_DEBUGGER,
}

export enum CollectionTarget {
  API = "API",
  CODE = "code",
}

export enum RefetchTargetType {
  API = "API",
}

export enum DebuggerWizardStepsEnum {
  WelcomeStep = 0,
  ClientSetupStep = 1,
  BackendStep = 2,
  SetupMCP = 3,
}

export enum WizzardLanguagesEnum {
  Javascript = "JavaScript (web)",
  NodeJs = "Node.Js",
  Go = "Go",
  Python = "Python",
  Ruby = "Ruby",
  DotNet = ".NET",
  Java = "Java",
  PHP = "PHP",
  Rust = "Rust",
  Swift = "Swift",
  Generic = "Generic",
}

export enum IDEType {
  Cursor,
  VisualStudio,
  Claude,
  Copilot,
  Zed,
  Windsurf,
  Generic,
}

export enum BackendSetupStep {
  SetupOpenTelemetry,
  RootTraces,
  CaptureRequestResponse,
}

export enum ContentIntegrationStep {
  UpdateServiceCode,
  UseEnvoyProxy,
}

export enum ProvidersEnum {
  OpenTelemetry,
  Datadog,
  OtherProvider,
  NewRelic,
}

export enum ClientSetupMethod {
  ChromeExtension,
  ClientLibrary,
  CLIApps,
  Mobile,
}

export enum RemoteRecordingResourceAttributes {
  SESSION_ATTRIBUTES = "session.attributes",
  RESOURCE_ATTRIBUTES = "session.resource.attributes",
  USER_ATTRIBUTES = "session.user.attributes",
}

export enum RemoteRecordingUserAttributes {
  Type = "type",
  ID = "id",
  Name = "name",
  GroupId = "groupId",
  GroupName = "groupName",
  UserEmail = "userEmail",
  UserId = "userId",
  UserName = "userName",
  AccountId = "accountId",
  AccountName = "accountName",
  OrgId = "orgId",
  OrgName = "orgName",
  Tags = "tags",
}

export enum IssueRateChartPeriod {
  HOUR_24 = "24h",
  DAY_7 = "7d",
  DAY_30 = "30d",
  DAY_90 = "90d",
  CUSTOM = "custom",
}

export enum MetricsGranularity {
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
}

export enum DeviceTypeEnum {
  Mobile = "Mobile",
  Tablet = "Tablet",
  Desktop = "Desktop",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
