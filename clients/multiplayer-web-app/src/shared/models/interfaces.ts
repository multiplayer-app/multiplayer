import * as Y from "yjs";
import * as yup from "yup";
import { BoxProps, ButtonProps, PlacementWithLogical } from "@chakra-ui/react";
import * as AwarenessProtocol from "y-protocols/awareness";
import { SessionType } from "@multiplayer-app/session-recorder-browser";

import {
  Edge,
  View,
  IEntity,
  Platform,
  EntityType,
  Resolution,
  ThreadStatus,
  IEntityCommit,
  IWorkspaceUser,
  EntityCommitMeta,
  ProjectBranchType,
  ProjectBranchStatus,
  IntegrationTypeEnum,
  ProjectLinkObjectType,
  EntityCommitChangeType,
  PlatformComponent,
  SortOrder,
  RadarDetectionType,
  FeatureFlag,
  ObjectTypeEnum,
  PlatformMetadata,
  Component,
  Group,
  GitRefTagType,
  ITag,
  RadarDetectionSource,
  NodeState,
  DebugSessionCreationReasonType,
  IssueSeverityLevel,
  RemoteSessionRecordingConditionCompareOperator,
  SessionRecordingMode,
  IssueGroupBy,
} from "@multiplayer/types";
import {
  GitObjectType,
  EntityStateStatus,
  EntityFormFieldType,
  GitSourceType,
  ComponentTypeEnum,
  SortingDirection,
  IssueRateChartPeriod,
  MetricsGranularity,
} from "./enums";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { IconType, ViewIdType } from "./types";
import { BaseYjsProvider } from "../../integrations/BaseYjsProvider";
import { SessionNotesSocketIOProvider } from "../../integrations/SessionNotesSocketIOProvider";

export interface INodeField {
  id: string;
  name: string;
  type: string;
}

export interface INodeData {
  fields?: INodeField[];
  [key: string]: any;
}

export interface INode extends Component {
  data?: INodeData;
  state: NodeState;
}

export interface IComponentNodeData extends Component {
  state: NodeState;
  isPassive?: boolean;
  isReadonly?: boolean;
  changeType?: EntityCommitChangeType;
}
export interface IPlatformGroupData extends Group {
  type: "group";
  state: NodeState;
  isPassive?: boolean;
  isReadonly?: boolean;
  changeType?: EntityCommitChangeType;
}
export interface IEdge {
  id: string;
  isDeleted?: boolean;
  source: string;
  target: string;
}

export interface IDiagramBoardState {
  nodes: Map<string, INode>;
  groups: Map<string, Group>;
  views: Record<string, View>;
  baseContent: Platform;
  metadata: PlatformMetadata;
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
  selectedGroups: Set<string>;
  currentViewId: string;
  componentsInPlatform: Component[];
}

export interface IPlatformComponentState {
  initialCommitContent: PlatformComponent;
  changedInputs: Map<string, EntityCommitChangeType>;
}

export interface IVariablesGroupState {
  initialCommitContent: any;
  changedInputs: Map<string, EntityCommitChangeType>;
}

export interface IDiagramBoardActions {
  onNodeCreate: (
    ids: string[],
    direction?: string,
    parentId?: string,
    shouldConnectToParent?: boolean
  ) => void;
  onNodeDelete: (id: string) => void;
  onNodeEdit: (id: string) => void;
  onNodeBulkUpdate: (changes: INode[]) => void;
  onMetadataChange: (key: string, value: any) => void;
  onEdgeCreate: (source: string, target: string) => void;
  onEdgeDelete: (payload: Edge) => void;
  onSelectionDone: (
    selectedNodes: string[],
    selectedEdges: string[],
    selectedGroups: []
  ) => void;
  onRestoreDeletedNode: (id: string) => void;
  onNodeSelect: (id: string, isMultiselect: boolean) => void;
  onEdgeSelect: (id: string, isMultiselect: boolean) => void;
  onSelectAll: () => void;
  onSelectionClear: () => void;
  onDeleteSelections: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: (event: any, payload: any) => void;
  onViewCreate: (isDuplicate?: boolean) => void;
  onViewDelete: (id: string) => void;
  onViewRename: (id: string, newName: string) => void;
  onViewSetDefault: () => void;
  onViewSelect: (id: string) => void;
  onAddNodeToView: (id: string) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  historyClear: () => void;
  setState: (payload: { nodes: INode[]; edges: Edge[] }) => void;
}

export interface IHistory {
  states: any[];
  index: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface IUseHistoryState<T> {
  data: T;
  history: IHistory;
}

export interface IEntityItem {
  id: string;
  name: string;
  entity: string;
  version?: string;
}

export interface IUserInfo {
  userId: string;
  avatarUri: string;
  name: string;
  color: string;
  x: number;
  y: number;
  path: string;
}

export interface IBilling {}

export interface IMember {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: number;
}

export interface ISettings {
  saml: null;
  googleSSO: boolean;
  magicLink: boolean;
  allowedDomains: string;
}
//
// export interface IProject {
//   id: string;
//   name: string;
//   version: string;
//   type: string;
//   team_id: string;
//   screenshot: string;
// }

export interface IListRes<T> {
  cursor: { total: number; skip: number; limit: number };
  data: T[];
  totalComments?: number;
}

export interface IEntityFormOption {
  value: string;
  label: string;
  icon: IconType;
  preview?: string;
}
export interface IEntityFormField {
  type: EntityFormFieldType;
  name: string;
  validation: yup.InferType<any>;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  layout?: "grid" | "list";
  options?: IEntityFormOption[];
  hint?: string;
  icon?: IconType;
}

export interface IEntityFormConfig {
  title: string;
  button: string;
  description?: string;
  preview?: string;
  fields: IEntityFormField[];
  fieldProps?: BoxProps;
  buttonProps?: ButtonProps;
  headerProps?: BoxProps;
}

export enum NavBarItemType {
  link,
  button,
}

export type ProjectEntityImportConfig = {
  button: string;
  hint: { text: string; icons: any[] };
  modal: {
    title: string;
    description?: string;
    background?: string;
    successMessage: string;
    learnMore?: { url: string; text: string; download?: string };
  };
  input: { title: string; description?: string; accept: string[] };
};

export type ProjectEntityEmptyScreen = {
  title: string;
  description: string;
  icons?: IconType[];
};

export interface IProjectConfig {
  key: string;
  name: string;
  sourceType?: string;
  type?: NavBarItemType;
  button?: string;
  entityType?: EntityType | null;
  navbarWidth?: number;
  showExplorer?: boolean;
  form?: IEntityFormConfig;
  featureFlag?: FeatureFlag;
  import?: ProjectEntityImportConfig;
  emptyScreen?: ProjectEntityEmptyScreen;
  hasVersioning?: boolean;
}

export interface AwarenessDiff {
  added: number[];
  updated: number[];
  removed: number[];
}

export interface ProviderConfig {
  autoConnect?: boolean;
  awareness?: AwarenessProtocol.Awareness;
  disableBc?: boolean;
  auth?: { [key: string]: any };
  query?: { [key: string]: any };
}

export interface ClientState {
  entityId: string;
  user?: IWorkspaceUser;
  pointer?: {
    x: number;
    y: number;
  };
  [key: string]: any;
}

export interface IPresentUser {
  name: string;
  id: string;
  color: string;
  avatar?: string;
  focusElement?: string;
}

export interface IUserPresenceState {
  [nodeId: string]: IPresentUser[];
}

export interface YjsProviderState<T extends BaseYjsProvider> {
  doc: Y.Doc | null;
  provider: T | null;
  error: Error;
  status: string;
  clients: ClientState[];
  refreshConnections: (branchId: string) => void;
}
export interface MultiplayerState
  extends YjsProviderState<YjsSocketIOProvider> {
  entity?: EntityWithMeta;
}
export interface DebugSessionNoteState
  extends YjsProviderState<SessionNotesSocketIOProvider> {
  refreshConnections: null | undefined;
}

export interface IReqParamsBase {
  skip?: number;
  limit?: number;
}
export interface IReqParamsSortable extends IReqParamsBase {
  sortKey?: string;
  sortDirection?: string; // '1' | '-1';
}

export interface ICreateBranchReqBody {
  name: string;
  type: ProjectBranchType;
  status?: ProjectBranchStatus;
  default?: boolean;
  archived?: boolean;
  parentProjectBranch?: string;
  parentCommit?: string;
}

export interface IUpdateBranchReqBody {
  archived: boolean;
  name: string;
  default: boolean;
  status: ProjectBranchStatus;
  type: ProjectBranchType;
  defaultGitBranchName: string;
}

export interface IGetBranchesReqParams extends IReqParamsBase {
  name?: string;
  default?: boolean;
  archived?: boolean;
  status?: ProjectBranchStatus[];
}

export interface IGetThreadsReqParams extends IReqParamsBase {
  branchId?: string;
  objectId?: string;
  status?: ThreadStatus;
  search?: string;
  sortOrder?: SortOrder;
  branchOnly?: boolean;
  objectType: ObjectTypeEnum;
}
export interface IGetCommentsReqParams extends IReqParamsBase {
  threadId?: string;
  branchId?: string;
  entityId?: string;
}

export interface IProjectBranchChange {
  _id: string;
  entity: IEntity;
  entityCommit: IEntityCommit;
}

export interface IGetChangesReqParams extends IReqParamsBase {
  changeType?: EntityCommitChangeType;
  commit?: string;
  entityType?: EntityType;
}

export interface IProjectBranchState {
  entityType: EntityType;
  entity: IEntity;
  entityCommit: IEntityCommit;
}

export interface IGetStateReqParams extends IReqParamsBase {
  entityType?: EntityType;
  entityId?: string | string[];
  commit?: string;
  hasUncommittedSource?: boolean;
}

export interface IGetGitReposReqParams extends IReqParamsBase {}

export interface IGetIntegrationsReqParams extends IReqParamsBase {
  project?: string;
}

export interface IGetReleasesReqParams extends IReqParamsBase {
  entity?: string;
}

export type EntityWithMeta = IEntity & { meta?: EntityCommitMeta };

export type EntityInstance = EntityWithMeta & {
  nodeId: string;
  isAdded?: boolean;
};

export interface ResolutionItem {
  patch?: any;
  content?: any;
  changeType?: EntityCommitChangeType;
  entityCommitId: string;
}

export interface EntityState {
  status: EntityStateStatus;
  entityType?: EntityType;
  hasConflicts?: boolean;
  conflicts?: Set<string>;
  source?: ResolutionItem | undefined;
  target?: ResolutionItem | undefined;
  initialContent?: any;
  changesForPreview?: any;
}

export interface IBranchUpdatePayload {
  branchToUpdate: string;
  baseBranch: string;
  resolutions?: Record<string, Resolution>;
  excludedEntities?: string[];
}

export interface IBranchMergePayload {
  projectBranchFrom: string;
  projectBranchTo: string;
  excludedEntities?: string[];
}

export interface IProjectLinkProps {
  path?: string;
  name: string;
  readonly?: boolean;
  sourceType: GitObjectType | IntegrationTypeEnum;
  objectType: ProjectLinkObjectType;
  repositoryId: string;
  gitRepositoryId: string;
  gitDefaultBranch: string;
  gitRepositoryType: IntegrationTypeEnum;
  openEntity?: boolean;
}

export interface IProjectTagProps {
  readonly?: boolean;
  path?: string;
  name?: string;
  systemTags?: string[];
  objectId?: string;
  type?: GitRefTagType;
  repositoryId?: string;
  gitRepositoryId?: string;
  gitRepositoryName?: string;
  gitRepositoryOwner?: string;
  gitDefaultBranch?: string;
  gitRepositoryType?: IntegrationTypeEnum;
  sourceType?: GitObjectType | IntegrationTypeEnum;
}

export interface IEditorProps<T = unknown> {
  doc?: Y.Doc;
  provider?: any;
  clients?: ClientState[];
  initialData?: T;
  readonly?: boolean;
  allowComments?: boolean;
  onChange?: (value: T) => void;
}
export interface IFileContentRes {
  contents: string;
  extension: string;
  sourceType: GitSourceType;
}

export type MultipSelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

export interface IMultiSelectFilterProps {
  options: MultipSelectOption[];
  filterName: string;
  selection: MultipSelectOption[] | string;
  setSelection: (
    selectionKey: string,
    newSelection: MultipSelectOption[]
  ) => void;
  selectionKey: string;
  searchable?: boolean;
  buttonProps?: any;
  menuProps?: any;
  menuPlacement?: PlacementWithLogical;
  sortAlphabetically?: boolean;
  selectionMode?: "single" | "multi";
  capitalizeLabels?: boolean;
}

export interface CodeProps extends Omit<IEditorProps<string>, "readonly"> {
  readonly?: boolean | string;
}

export interface ITableSorting {
  key: string;
  direction: SortingDirection;
}

export interface IAIExtractedComponents {
  name: string;
  position: { x: number; y: number };
  type: ComponentTypeEnum;
  dependencies: string[];
  tags: string[];
}

export interface IEntityUpdateBulkPayload {
  entityId: string;
  key: string;
  keyAliases: string[];
}

export interface IEntityUpdatePayload {
  archived: boolean;
  key: string;
  path: string;
  metadata?: Record<string, string>;
  keyAliases: string[];
  tags: ITag[];
  gitRefBranch: string;
}

export interface IEntityDeleteBulkPayload {
  entityIds?: string[];
  type?: EntityType;
}

export interface IEntityMergePayload {
  entityIds?: string[];
  keyAliases?: string[];
  key: string;
  type: EntityType;
}

export interface IExtractedTableData {
  name: string;
  position: { x: number; y: number };
  type: ComponentTypeEnum;
  dependencies: string[];
  tags: ITag[];
  isSystem: boolean;
  description?: string;
  _id?: string;
  entityId?: string;
  fileId?: string;
}

export interface IViewItem {
  id: ViewIdType;
  name: string;
}

export interface IGetRadarDetectionsReqParams extends IReqParamsBase {
  Sign: string[];
  sortKey: string[];
  sortDirection: string[];
  entity: string;
  release: string;
  platform: string;
  environment: string;
  projectBranch: string;
  type: RadarDetectionType;
  componentName: string | string[];
  componentAliasName: boolean;
}
export interface IGetDebugSessionsReqParams extends IReqParamsSortable {
  issueHash?: string;
  endUserHash?: string;
  name?: string;
  tags?: string[];
  creationReason?:
    | DebugSessionCreationReasonType
    | DebugSessionCreationReasonType[];
  sessionType?: SessionType;
  continuousDebugSession?: boolean;
  fromContinuousDebugSession?: boolean;
  starred?: boolean;
  live?: boolean;
  hasStarredItems?: boolean;
  metadata?: Record<string, any>;
}

export interface IGetIssuesReqParamsBase {
  titleHash?: string | string[];
  componentHash?: string | string[];
  customHash?: string | string[];
  hash?: string | string[];
  groupBy?: IssueGroupBy;
  resolved?: boolean;
  archived?: boolean;
  title?: string;
  text?: string;
  severity?: IssueSeverityLevel;
  "lastSeen.gte"?: string;
  "lastSeen.lte"?: string;
  "metrics.from"?: string;
  "metrics.to"?: string;
  "metrics.granularity"?: MetricsGranularity;
}

export interface IGetIssuesReqParams
  extends IReqParamsSortable,
    IGetIssuesReqParamsBase {}

export interface IIssuesFilters extends IReqParamsBase {
  sorting?: ITableSorting;
  resolved?: boolean;
  archived?: boolean;
  title?: string;
  text?: string;
  severity?: IssueSeverityLevel;
  period?: IssueRateChartPeriod;
  lastSeen?: {
    gte?: string;
    lte?: string;
  };
  "service.serviceNameSlug"?: string;
  "service.environmentSlug"?: string;
}

export interface IssueRateSeries {
  time: string;
  value: number;
}

export type IssueRateChartData = Array<{
  metricName: string;
  color?: string;
  series: IssueRateSeries[];
}>;

export interface IDeleteRadarDetectionsReqParams extends IReqParamsBase {
  ids?: string[];
  type?: RadarDetectionType;
  Sign: RadarDetectionSource;
}

export interface IRadarDetectionFilters {
  type?: { label: string; value: string }[];
  environment?: { label: string; value: string }[];
  release?: string[];
  dateRange?: Date[];
  componentName?: string | string[];
  projectBranch?: string;
}

export interface IRadarStartDebugSession {
  metadata: Record<string, string>;
}

export interface IRadarStopDebugSession {
  metadata: Record<string, string>;
}

export interface VirtualBoxHandle {
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto" }
  ) => void;
}

export enum SocketNamespace {
  REQUEST = "request",
  ENTITY = "yjs",
  SESSION_NOTES = "session-notes",
}

export interface EntityStateParams {
  projectId: string;
  branchId: string;
  entityId: string;
  entityType: EntityType;
}

export interface RequestStateParams {
  projectId: string;
  branchId: string;
}

export interface SessionNoteStateParams {
  sessionId: string;
  projectId: string;
  workspaceId: string;
}

export interface RemoteRecordingStartCondition {
  attributeRoot?: string;
  attributePath: string;
  value?: string;
  conditionType: RemoteSessionRecordingConditionCompareOperator;
}

export interface RemoteRecordingStopCondition {
  maxTime: number;
  idleTime: number;
}

export interface IIssuesBulkOperationParams
  extends Omit<
    IGetIssuesReqParamsBase,
    | "metrics.from"
    | "metrics.to"
    | "metrics.granularity"
    | "titleHash"
    | "componentHash"
    | "customHash"
  > {
  ids?: string[];
  titleHash?: string[];
  componentHash?: string[];
  customHash?: string[];
}

export interface EndUserRecordingSettings {
  recordingOptions?: {
    frontend: {
      screens: boolean;
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
    backend: {
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
  };
  whenToRecord: string;
  sessionRecordingsLimit: number;
}

export interface EndUserRecordingSettingsBulk {
  recordingOptions?: {
    frontend: {
      screens: boolean;
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
    backend: {
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
  };
  whenToRecord: string;
  sessionRecordingsLimit: number;
  ids: string[];
}

export interface RemoteRecordingConditionSettings {
  enabled: boolean;
  samplingRate: number;
  maxRemoteSessionRecordings?: number | null;
  recordingOptions: {
    frontend: {
      screens: boolean;
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
    backend: {
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
  };
  startConditions: {
    startOnError: boolean;
  };
  stopConditions: RemoteRecordingStopCondition;
}

export interface RemoteSessionRecordingSettings {
  name: string;
  description: string;
  enabled: boolean;
  samplingRate: number;
  mode: SessionRecordingMode;
  conditions: {
    start: RemoteRecordingStartCondition[];
    stop: RemoteRecordingStopCondition;
  };
  recordingOptions: {
    frontend: {
      screens: boolean;
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
    backend: {
      traces: boolean;
      logs: boolean;
      logLevel: string;
      content: boolean;
    };
  };
}

export interface IssuesBulkOperationPayload {
  resolved?: boolean;
  archived?: boolean;
  severity?: IssueSeverityLevel;
}
