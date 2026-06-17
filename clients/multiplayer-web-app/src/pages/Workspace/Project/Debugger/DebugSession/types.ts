import { EndUserType, OtelScope } from "@multiplayer/types";
import type { LogData } from "@rrweb/rrweb-plugin-console-record";
import { pluginEvent } from "@rrweb/types";
import { RemoteRecordingUserAttributes } from "shared/models/enums";

export interface IResourceAttributes {
  "service.name": string;
  "telemetry.sdk.language": string;
  "telemetry.sdk.name": string;
  "telemetry.sdk.version": string;
  "service.version": string;
  "service.namespace": string;
  "host.name": string;
  "os.type": string;
  [key: string]: any;
}

export interface ISpanAttributes {
  "http.method": string;
  "http.url": string;
  "http.status_code": string;
  "http.status_text": string;
  "http.host": string;
  "http.scheme": string;
  "http.request.headers": string;
  "http.response.headers": string;
  "multiplayer.project._id": string;
  "multiplayer.debug_session._id": string;
  "http.response_content_length": string;
  "http.user_agent": string;
  "multiplayer.workspace._id": string;
  "multiplayer.integration._id": string;
  [key: string]: any;
}

export interface ILogData {
  id: string;
  Timestamp: string;
  TraceId: string;
  SpanId: string;
  ServiceName: string;
  ResourceAttributes: IResourceAttributes;
  ScopeName: string;
  ScopeVersion: string; // till here the properties overlap with ITraceData, make separate base interface later
  TraceFlags: number;
  SeverityText: "info" | "warn" | "debug" | "error";
  SeverityNumber: number;
  Body: string;
  ResourceSchemaUrl: string;
  ScopeSchemaUrl: string;
  ScopeAttributes: any;
  LogAttributes: any;
}

export interface ITraceData {
  id: string;
  Timestamp: string;
  TraceId: string;
  SpanId: string;
  ParentSpanId: string;
  TraceState: string;
  SpanName: string;
  SpanKind: string;
  ServiceName: string;
  ResourceAttributes: IResourceAttributes;
  ScopeName: OtelScope;
  ScopeVersion: string;
  SpanAttributes: ISpanAttributes;
  Duration: string;
  StatusCode: string;
  StatusMessage: string;
  "Events.Timestamp": string[];
  "Events.Name": string[];
  "Events.Attributes": Record<string, any>[];
  "Links.TraceId": string[];
  "Links.SpanId": string[];
  "Links.TraceState": string[];
  "Links.Attributes": Record<string, any>[];
}

export interface IConsoleNode extends pluginEvent<LogData> {
  message: string;
}

export interface ILogNode extends ILogData {}

export interface ITraceNode extends ITraceData {}
export interface IEventNode extends ITraceData {}

export interface ISessionData {
  startTime: number;
  endTime: number;
  totalTime: number;
}

export enum DebugSessionNodeType {
  Event = "event",
  Console = "consoleEvent",
  Trace = "trace",
  Log = "log",
}

export interface IDebugSessionNode<T> {
  meta: T;
  id: string;
  duration?: number;
  timestamp: number;
  type: DebugSessionNodeType;
  hasError?: boolean;
  childSpans?: IDebugSessionNode<T>[];
}

export interface ISessionNodeProps<T> {
  node: IDebugSessionNode<T>;
  collapsable?: boolean;
}

export const ResourceAttributesToNameMap = {
  browserInfo: "Browser Information",
  osInfo: "OS Information",
  deviceInfo: "Device Type",
  screenSize: "Screen Size",
  pixelRatio: "Pixel Ratio",
  cookiesEnabled: "Cookies Enabled",
  hardwareConcurrency: "Hardware Concurrency",
  packageVersion: "Package Version",
};

export const UserAttributesToNameMap = {
  [RemoteRecordingUserAttributes.Type]: "Type",
  [RemoteRecordingUserAttributes.ID]: "ID",
  [RemoteRecordingUserAttributes.Name]: "Name",
  [RemoteRecordingUserAttributes.GroupId]: "Group ID",
  [RemoteRecordingUserAttributes.GroupName]: "Group Name",
  [RemoteRecordingUserAttributes.UserEmail]: "User Email",
  [RemoteRecordingUserAttributes.UserId]: "User ID",
  [RemoteRecordingUserAttributes.UserName]: "User Name",
  [RemoteRecordingUserAttributes.AccountId]: "Account ID",
  [RemoteRecordingUserAttributes.AccountName]: "Account Name",
  [RemoteRecordingUserAttributes.OrgId]: "Organization ID",
  [RemoteRecordingUserAttributes.OrgName]: "Organization Name",
  [RemoteRecordingUserAttributes.Tags]: "Tags",
};

export const EndUserTypesToNameMap = {
  [EndUserType.USER]: "User",
  [EndUserType.VISITOR]: "Visitor",
  [EndUserType.API_CLIENT]: "API Client",
};

export enum SessionTabIndex {
  All = 0,
  Events = 1,
  Console = 2,
  Traces = 3,
  Logs = 4,
  Metadata = 5,
  Comments = 6,
}

export const SessionTabToDebugNodeType = {
  [SessionTabIndex.Events]: DebugSessionNodeType.Event,
  [SessionTabIndex.Console]: DebugSessionNodeType.Console,
  [SessionTabIndex.Traces]: DebugSessionNodeType.Trace,
  [SessionTabIndex.Logs]: DebugSessionNodeType.Log,
};

export enum SessionPreviewMode {
  Recording = "recording",
  Map = "map",
  None = "none",
}
export interface IDebugSessionFilters {
  mostRelevant: boolean;
  starred: boolean;
  type: { label: string; value: DebugSessionNodeType }[];
  component: { label: string; value: string }[];
  level: { label: string; value: string }[];
  status: { label: string; value: string }[];
  showOnlyExceptions: boolean;
  search: string;
}

export type DebugSessionNodesState = {
  [DebugSessionNodeType.Event]: IDebugSessionNode<ITraceData>[];
  [DebugSessionNodeType.Console]: IDebugSessionNode<IConsoleNode>[];
  [DebugSessionNodeType.Trace]: IDebugSessionNode<ITraceData>[];
  [DebugSessionNodeType.Log]: IDebugSessionNode<ILogData>[];
};
