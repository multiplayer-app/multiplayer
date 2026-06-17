import {
  IAlertRule,
  IDebugSession,
  IAgentChat,
  IEntity,
  IEntityCommit,
  ITag,
  DebugSessionCreationReasonType,
  IDebugSessionView,
  IFlowMetadata,
  IFlow,
  ISessionNote,
  IIssue,
  EndUserType,
  IEndUser,
  IUser,
  MetricName,
  IAgent,
} from "@multiplayer/types";
import { radarInstance } from "shared/api";
import { memoizeApiFunction } from "shared/helpers/api.helpers";
import { MetricsGranularity } from "shared/models/enums";
import {
  IListRes,
  IReqParamsBase,
  IReqParamsSortable,
  IGetIssuesReqParams,
  EndUserRecordingSettings,
  IGetDebugSessionsReqParams,
  IIssuesBulkOperationParams,
  IssuesBulkOperationPayload,
  EndUserRecordingSettingsBulk,
  IGetRadarDetectionsReqParams,
  RemoteSessionRecordingSettings,
  IDeleteRadarDetectionsReqParams,
  RemoteRecordingConditionSettings,
  IssueRateSeries,
} from "shared/models/interfaces";

export type AlertRulePayload = Omit<
  IAlertRule,
  "_id" | "workspace" | "project" | "createdAt" | "updatedAt"
>;

export const getRadarDetectionGroups = (
  workspaceId: string,
  projectId: string,
  params: Partial<IGetRadarDetectionsReqParams>
): Promise<IListRes<any>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/grouped`,
    { params }
  );
};

export const getRadarDetections = (
  workspaceId: string,
  projectId: string,
  params: Partial<IGetRadarDetectionsReqParams>
): Promise<IListRes<any>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections`,
    { params }
  );
};

export const getRadarDependencyDetections = (
  workspaceId: string,
  projectId: string,
  params: Partial<IGetRadarDetectionsReqParams>
): Promise<IListRes<any>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/dependencies`,
    { params }
  );
};

export const deleteRadarDetections = (
  workspaceId: string,
  projectId: string,
  body: IDeleteRadarDetectionsReqParams
): Promise<IListRes<any>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/bulk`,
    { data: body }
  );
};

export const getRadarDetectedEnvironments = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/environments`
  );
};

export const getRadarPlatforms = (
  workspaceId: string,
  projectId: string,
  params: any
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/platforms`,
    { params }
  );
};

export const getUniqueComponentsInDependencies = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/components`
  );
};

export const getAPIDetails = (
  workspaceId: string,
  projectId: string,
  endpointId: string
): Promise<any> => {
  const encodedId = encodeURIComponent(endpointId);
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/radar-detections/${encodedId}/params`
  );
};

export const getDebugSessions = (
  workspaceId: string,
  projectId: string,
  params: IGetDebugSessionsReqParams
): Promise<IListRes<IDebugSession>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions`,
    { params }
  );
};

export const startDebugSession = (
  apiKey: string,
  data: { name?: string; sessionAttributes?: Record<string, any> }
): Promise<IDebugSession> => {
  return radarInstance.post(`/debug-sessions/start`, data, {
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
  });
};

export const stopDebugSession = (
  apiKey: string,
  debugSessionId: string
): Promise<IDebugSession> => {
  return radarInstance.patch(
    `/debug-sessions/${debugSessionId}/stop`,
    {},
    { headers: { "Content-Type": "application/json", "X-Api-Key": apiKey } }
  );
};

export const getDebugSession = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string
): Promise<IDebugSession> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}`
  );
};

export const getAgentSession = (
  workspaceId: string,
  projectId: string,
  agentSessionId: string
): Promise<IAgentChat> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/chats/${agentSessionId}`
  );
};

export const generateNotebookFromDebugSession = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string
): Promise<{ entity: IEntity; entityCommit: IEntityCommit }> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/generate`
  );
};

export const updateDebugSession = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  body: { name?: string; tags?: ITag[]; starred?: boolean }
): Promise<IDebugSession> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}`,
    body
  );
};

export const deleteDebugSession = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string
) => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}`
  );
};

export const deleteDebugSessionsBulk = (
  workspaceId: string,
  projectId: string,
  body: {
    ids?: string[];
    tags?: string[];
    starred?: boolean;
    issueHash?: string;
    creationReason?:
      | DebugSessionCreationReasonType
      | DebugSessionCreationReasonType[];
    fromContinuousDebugSession?: boolean;
  }
) => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/bulk`,
    body && { data: body }
  );
};

export const getSessionEvents = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  params = { skip: 0, limit: 1000 }
): Promise<any[]> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/rrweb-events`,
    { params }
  );
};

export const getSessionLogs = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  params = { skip: 0, limit: 1000 }
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/otel-logs`,
    { params }
  );
};

export const getSessionTraces = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  params = { skip: 0, limit: 1000 }
): Promise<IListRes<any>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/otel-traces`,
    { params }
  );
};

export const addDebugSessionStar = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  nodeId: string
): Promise<IListRes<any>> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/stars`,
    { starId: nodeId }
  );
};

export const removeDebugSessionStar = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  nodeId: string
): Promise<IListRes<any>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/stars`,
    { data: { starId: nodeId } }
  );
};

export const addDebugSessionView = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  body: Omit<IDebugSessionView, "_id">
): Promise<IDebugSessionView> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/views`,
    body
  );
};

export const renameDebugSessionView = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  viewId: string,
  body: Partial<IDebugSessionView>
): Promise<any> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/views/${viewId}`,
    body
  );
};

export const removeDebugSessionView = (
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  viewId: string
): Promise<any> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/debug-sessions/${debugSessionId}/views/${viewId}`
  );
};

export const getFlows = (
  workspaceId: string,
  projectId: string,
  params: IReqParamsBase
): Promise<IListRes<IFlowMetadata>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/metadata`,
    { params }
  );
};

export const getUniqueComponentsInFlows = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/metadata/unique-components`
  );
};

export const getFlow = (
  workspaceId: string,
  projectId: string,
  flowId: string
): Promise<{ flow: IFlow; metadata: IFlowMetadata }> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/${flowId}`
  );
};

export const updateFlow = (
  workspaceId: string,
  projectId: string,
  flowId: string,
  body: Partial<IFlowMetadata>
): Promise<IFlowMetadata> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/${flowId}/metadata`,
    body
  );
};

export const deleteFlow = (
  workspaceId: string,
  projectId: string,
  flowId: string
): Promise<IListRes<IFlowMetadata>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/${flowId}`
  );
};

export const deleteFlowsBulk = (
  workspaceId: string,
  projectId: string,
  body: { ids: string[] }
): Promise<IListRes<IFlowMetadata>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/flows/bulk`,
    body && { data: body }
  );
};

export const getSystemCatalogStats = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/stats`
  );
};

export const getSessionNote = (params: {
  workspaceId: string;
  projectId: string;
  sessionId: string;
}): Promise<ISessionNote> => {
  return radarInstance.get(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes`
  );
};

export const createSessionNote = (params: {
  workspaceId: string;
  projectId: string;
  sessionId: string;
}): Promise<ISessionNote> => {
  return radarInstance.post(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes`
  );
};

export const uploadSessionNoteUpdate = (
  params: {
    workspaceId: string;
    projectId: string;
    sessionId: string;
    updateId: string;
  },
  update: Uint8Array
): Promise<void> => {
  return radarInstance.post(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes/updates/${params.updateId}`,
    update,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
};

export const downloadSessionNoteUpdate = (params: {
  workspaceId: string;
  projectId: string;
  sessionId: string;
  updateId: string;
}): Promise<Uint8Array> => {
  return radarInstance.get(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes/updates/${params.updateId}`,
    {
      responseType: "arraybuffer",
    }
  );
};

export const uploadSessionNoteFile = (
  params: {
    workspaceId: string;
    projectId: string;
    sessionId: string;
    blockId: string;
  },
  update: Uint8Array | string
): Promise<void> => {
  let buffer: Uint8Array;
  if (typeof update === "string") {
    // Convert base64 string to Uint8Array
    const binaryString = atob(update);
    buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }
  } else {
    buffer = update;
  }

  return radarInstance.post(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes/files/${params.blockId}`,
    buffer,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
};

export const downloadSessionNoteFile = (params: {
  workspaceId: string;
  projectId: string;
  sessionId: string;
  blockId: string;
}): Promise<Uint8Array> => {
  return radarInstance.get(
    `/workspaces/${params.workspaceId}/projects/${params.projectId}/debug-sessions/${params.sessionId}/notes/files/${params.blockId}`,
    {
      responseType: "arraybuffer",
    }
  );
};

export const getIssues = (
  workspaceId: string,
  projectId: string,
  params: IGetIssuesReqParams
): Promise<IListRes<IIssue>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/issues/grouped`,
    { params }
  );
};

export const deleteIssuesBulk = (
  workspaceId: string,
  projectId: string,
  body?: IIssuesBulkOperationParams
) => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/issues/bulk`,
    body && { data: body }
  );
};

export const getIssue = memoizeApiFunction(
  (
    workspaceId: string,
    projectId: string,
    issueId: string
  ): Promise<IIssue> => {
    return radarInstance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`
    );
  }
);

export const getIssueByComponentHash = memoizeApiFunction(
  (
    workspaceId: string,
    projectId: string,
    componentHash: string
  ): Promise<IIssue> => {
    return radarInstance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/issues/hash/component/${encodeURIComponent(
        componentHash
      )}`
    );
  }
);

export const getIssueByTitleHash = memoizeApiFunction(
  (
    workspaceId: string,
    projectId: string,
    titleHash: string
  ): Promise<IIssue> => {
    return radarInstance.get(
      `/workspaces/${workspaceId}/projects/${projectId}/issues/hash/title/${encodeURIComponent(
        titleHash
      )}`
    );
  }
);

export const getEndUsers = (
  workspaceId: string,
  projectId: string,
  params: IReqParamsSortable & {
    text?: string;
    "lastSeen.gte"?: string;
    "lastSeen.lte"?: string;
    "attributes.orgName"?: string;
    "attributes.type"?: EndUserType;
  }
): Promise<IListRes<IEndUser>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users`,
    { params }
  );
};

export const getEndUser = (
  workspaceId: string,
  projectId: string,
  endUserId: string,
  params?: {
    "metrics.from"?: string;
    "metrics.to"?: string;
    "metrics.granularity"?: MetricsGranularity;
  }
): Promise<IEndUser> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}`,
    { params }
  );
};

export const startEndUserRemoteSessionRecording = (
  workspaceId: string,
  projectId: string,
  endUserId: string
): Promise<IUser> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}/remote-session-recording/start`
  );
};

export const startBulkEndUserRemoteSessionRecording = (
  workspaceId: string,
  projectId: string,
  body: { ids: string[] }
): Promise<IUser> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording/start/bulk`,
    body
  );
};

export const stopBulkEndUserRemoteSessionRecording = (
  workspaceId: string,
  projectId: string,
  body: { ids: string[] }
): Promise<IUser> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording/stop/bulk`,
    { body }
  );
};

export const stopEndUserRemoteSessionRecording = (
  workspaceId: string,
  projectId: string,
  endUserId: string
): Promise<IUser> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}/remote-session-recording/stop`
  );
};

export const deleteEndUsers = (
  workspaceId: string,
  projectId: string,
  body: { ids: string[] }
): Promise<IListRes<IUser>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/bulk`,
    { data: body }
  );
};

export const deleteEndUser = (
  workspaceId: string,
  projectId: string,
  endUserId: string
): Promise<IListRes<IUser>> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}`
  );
};

export const listEndUserIssues = (
  workspaceId: string,
  projectId: string,
  endUserId: string,
  params?: IGetIssuesReqParams
): Promise<IListRes<IIssue>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}/issues`,
    { params }
  );
};

export const updateIssuesBulk = (
  workspaceId: string,
  projectId: string,
  body: {
    filter: IIssuesBulkOperationParams;
    payload: IssuesBulkOperationPayload;
  }
) => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/issues/bulk`,
    body
  );
};

export const getIssueMetrics = (
  workspaceId: string,
  projectId: string,
  params?: {
    from?: string;
    to?: string;
    issueId?: string;
    issueTitleHash?: string;
    issueComponentHash?: string;
    issueCustomHash?: string;
    granularity?: MetricsGranularity;
    release?: string;
    environment?: string;
    metricName?: MetricName[];
  }
): Promise<Record<MetricName, IssueRateSeries[]>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/metrics`,
    { params }
  );
};

export const getIssueSpans = (
  workspaceId: string,
  projectId: string,
  issueId: string,
  params: IReqParamsSortable = {}
): Promise<IListRes<any>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/spans`,
    { params }
  );
};

export const getGroupIssues = (
  workspaceId: string,
  projectId: string,
  params: IGetIssuesReqParams
): Promise<IListRes<IIssue>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/issues`,
    { params }
  );
};

export const getIssueEndUsers = (
  workspaceId: string,
  projectId: string,
  issueId: string,
  params: IReqParamsSortable = {}
): Promise<IListRes<IEndUser>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/end-users`,
    { params }
  );
};

export const listAlertRules = (
  workspaceId: string,
  projectId: string,
  params: IReqParamsSortable
): Promise<IListRes<IAlertRule>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules`,
    { params }
  );
};

export const getAgents = (
  workspaceId: string,
  projectId: string,
  params: IReqParamsSortable & { type?: string }
): Promise<IListRes<IAgent>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/agents`,
    { params }
  );
};

export const createAgentChat = (
  workspaceId: string,
  projectId: string,
  body?: {
    title?: string;
    agentId?: string;
    agentType: string;
    context?: Record<string, any>;
  }
): Promise<IAgentChat> => {
  return radarInstance.post(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/chats`,
    body
  );
};

export type AgentChatsListParams = {
  skip?: number;
  limit?: number;
  status?: string;
  agentId?: string;
  archived?: boolean;
  agentName?: string;
  dir?: string;
};

export const getAgentChatsList = (
  workspaceId: string,
  projectId: string,
  params?: AgentChatsListParams
): Promise<IListRes<IAgentChat>> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/chats`,
    { params }
  );
};

export type AgentChatsBulkRemoveParams = {
  ids?: string[];
  status?: string;
  agentId?: string;
  type?: string;
};

export const deleteAgentChatsBulk = (
  workspaceId: string,
  projectId: string,
  body?: AgentChatsBulkRemoveParams
) => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/chats/bulk`,
    body && { data: body }
  );
};

export type AgentChatsBulkUpdatePayload = {
  archived?: boolean;
};

export const updateAgentChatsBulk = (
  workspaceId: string,
  projectId: string,
  filter: AgentChatsBulkRemoveParams,
  payload: AgentChatsBulkUpdatePayload
) => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/chats/bulk`,
    { filter, payload }
  );
};

export const getAgent = (
  workspaceId: string,
  projectId: string,
  agentId: string
): Promise<IAgent> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/agents/${agentId}`
  );
};

export const getAlertRule = (
  workspaceId: string,
  projectId: string,
  alertRuleId: string
): Promise<IAlertRule> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules/${alertRuleId}`
  );
};

export const createAlertRule = (
  workspaceId: string,
  projectId: string,
  body: AlertRulePayload
): Promise<IAlertRule> => {
  return radarInstance.post(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules`,
    body
  );
};

export const updateAlertRule = (
  workspaceId: string,
  projectId: string,
  alertRuleId: string,
  body: Partial<AlertRulePayload>
): Promise<IAlertRule> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules/${alertRuleId}`,
    body
  );
};

export const removeAlertRule = (
  workspaceId: string,
  projectId: string,
  alertRuleId: string
): Promise<void> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules/${alertRuleId}`
  );
};

export const testAlertRuleAction = (
  workspaceId: string,
  projectId: string,
  alertRuleId: string,
  body: any
): Promise<void> => {
  return radarInstance.post(
    `/workspaces/${workspaceId}/projects/${projectId}/alert-rules/${alertRuleId}/actions/test`,
    body
  );
};

export const getRemoteSessionRecordingSettings = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-settings`
  );
};

export const updateConditionalRecordingSettings = (
  workspaceId: string,
  projectId: string,
  body: RemoteRecordingConditionSettings
): Promise<any> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-settings`,
    body
  );
};

export const updateEndUserSessionRecordingSettings = (
  workspaceId: string,
  projectId: string,
  endUserId: string,
  body: EndUserRecordingSettings
): Promise<any> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/${endUserId}/session-recording-settings`,
    body
  );
};

export const updateEndUserSessionRecordingSettingsBulk = (
  workspaceId: string,
  projectId: string,
  body: EndUserRecordingSettingsBulk
): Promise<any> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/end-users/session-recording-settings/bulk`,
    body
  );
};

export const listRemoteSessionRecordingConditions = (
  workspaceId: string,
  projectId: string
): Promise<any> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-conditions`
  );
};

export const createRemoteSessionRecordingConditions = (
  workspaceId: string,
  projectId: string,
  body: RemoteSessionRecordingSettings
): Promise<any> => {
  return radarInstance.post(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-conditions`,
    body
  );
};

export const updateRemoteSessionRecordingConditions = (
  workspaceId: string,
  projectId: string,
  conditionalRecordingFiltersId: string,
  body: RemoteSessionRecordingSettings
): Promise<any> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-conditions/${conditionalRecordingFiltersId}`,
    body
  );
};

export const removeRemoteSessionRecordingConditions = (
  workspaceId: string,
  projectId: string,
  conditionalRecordingFiltersId: string
): Promise<any> => {
  return radarInstance.delete(
    `/workspaces/${workspaceId}/projects/${projectId}/remote-session-recording-conditions/${conditionalRecordingFiltersId}`
  );
};

export const getGlobalIssuesSettings = (
  workspaceId: string,
  projectId: string
): Promise<{ createOnlyForCategories: string[] }> => {
  return radarInstance.get(
    `/workspaces/${workspaceId}/projects/${projectId}/issues-settings`
  );
};

export const updateGlobalIssuesSettings = (
  workspaceId: string,
  projectId: string,
  body: { createOnlyForCategories: string[] }
): Promise<{ createOnlyForCategories: string[] }> => {
  return radarInstance.patch(
    `/workspaces/${workspaceId}/projects/${projectId}/issues-settings`,
    body
  );
};

export const getLatestSessionRecorderReactVersion = memoizeApiFunction(
  async () => {
    return fetch(
      `https://registry.npmjs.org/@multiplayer-app/session-recorder-react`
    )
      .then((res) => res.json())
      .then((data) => data["dist-tags"].latest);
  }
);
