export interface IDebugSession {
  _id: string
  shortId: string
  workspace: string
  project: string
  name: string
  startedAt: string | Date
  stoppedAt: string | Date
  durationInSeconds?: number
  createdAt: string | Date
  updatedAt: string | Date
  metadata: {
    userName?: string,
    userId?: string,
    accountName?: string,
    accountId?: string,
  } & object
  tags: ITag[]
  userMetadata: {
    email?: string
    notifyOnUpdates?: boolean
    comment?: string
  },
  clientMetadata: object
  views: IDebugSessionView[]
  starred: string[]
  s3Files: {
    _id?: string
    bucket: string
    key: string
    dataType: DebugSessionDataType
    url?: string
  }[]
  finishedS3Transfer?: boolean
}

export interface ListDebugSessionsFilter {
  skip?: number
  limit?: number
  name?: string
  startedAfterTimestamp?: number
  startedBeforeTimestamp?: number
  maxDurationInSeconds?: number
  minDurationInSeconds?: number
  metadata?: {
    [key: string]: string
  }
  hasStarred?: boolean
  sortDirection?: 1 | -1
  sortKey?: string
  issueComponentHash?: string
}

export interface ListGroupedIssuesFilter {
  groupBy?: string
  skip?: number
  limit?: number
  sortKey?: string
  sortDirection?: 1 | -1
  resolved?: boolean
  archived?: boolean
  severity?: number
  category?: string
  title?: string
  text?: string
  titleHash?: string | string[]
  componentHash?: string | string[]
}

export interface ResolveIssuesParams {
  titleHashes: string[]
  resolved?: boolean
  archived?: boolean
}

export interface ITag {
  key?: string
  value: string
}

export enum DebugSessionDataType {
  OTLP_TRACES = 'OTLP_TRACES',
  OTLP_LOGS = 'OTLP_LOGS',
  RRWEB_EVENTS = 'RRWEB_EVENTS',
}

export interface IDebugSessionView {
  _id: string
  name: string;
  components?: string[];
}


export interface IResourceAttributes {
  'service.name': string;
  'telemetry.sdk.language': string;
  'telemetry.sdk.name': string;
  'telemetry.sdk.version': string;
  'service.version': string;
  'service.namespace': string;
  'host.name': string;
  'os.type': string;
  [key: string]: any;
}

export interface ISpanAttributes {
  'http.method': string;
  'http.url': string;
  'http.status_code': string;
  'http.status_text': string;
  'http.host': string;
  'http.scheme': string;
  'http.request.headers': string;
  'http.response.headers': string;
  'multiplayer.project._id': string;
  'multiplayer.debug_session._id': string;
  'http.response_content_length': string;
  'http.user_agent': string;
  'multiplayer.workspace._id': string;
  'multiplayer.integration._id': string;
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
  SeverityText: 'info' | 'warn' | 'debug' | 'error';
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
  ScopeName: string;
  ScopeVersion: string;
  SpanAttributes: ISpanAttributes;
  Duration: string;
  StatusCode: string;
  StatusMessage: string;
  'Events.Timestamp': string[];
  'Events.Name': string[];
  'Events.Attributes': Record<string, any>[];
  'Links.TraceId': string[];
  'Links.SpanId': string[];
  'Links.TraceState': string[];
  'Links.Attributes': Record<string, any>[];
}
export interface IDebugSessionRrwebEvent {
  id: string
  workspaceId: string
  projectId: string
  debugSessionId: string
  type: number
  data: string
  timestamp: string
}

export interface MultiplayerListResponse<T> {
  data: T[],
  cursor: {
    total: number,
    skip: number,
    limit: number
  }
}

export enum DebugSessionNodeType {
  Event = 'event',
  Console = 'consoleEvent',
  Trace = 'trace',
  Log = 'log',
}

export interface IDebugSessionNode<T> {
  meta: T;
  id: string;
  duration?: number;
  timestamp: number;
  type: DebugSessionNodeType;
  childSpans?: IDebugSessionNode<T>[];
}


export enum OtelScope {
  http = '@opentelemetry/instrumentation-http',
  fetch = '@opentelemetry/instrumentation-fetch',
  httpXmlRequest = '@opentelemetry/instrumentation-xml-http-request',
  documentLoad = '@opentelemetry/instrumentation-document-load',
  userInteraction = '@opentelemetry/instrumentation-user-interaction',
  multiplayerNotebookHttp = '@multiplayer/notebook-http',
}

export enum AuthType {
  API_KEY = 'API_KEY',
  OAUTH_TOKEN = 'OAUTH_TOKEN',
}

export interface DataWithCursor<T> {
  cursor: {
    skip?: number
    limit?: number
    total: number
  }
  data: Array<T>
}

