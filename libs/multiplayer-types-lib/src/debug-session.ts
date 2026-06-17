import { SessionType } from '@multiplayer-app/session-recorder-common'
import { ITag } from './tag'
import {
  DebugSessionDataType,
  DebugSessionCreationReasonType,
  // EndUserType,
} from './enums'
import { IEndUserAttributes } from './EndUserAttributes'

export interface IDebugSessionView {
  _id: string
  name: string
  components?: string[]
}

export interface IDebugSessionIssue {
  issueHash: string
  issueTitleHash: string
  issueComponentHash: string
  issueCustomHash?: string
  traceId: string
  spanId: string
}

export interface IDebugSession {
  _id: string
  sessionType: SessionType
  creationReason: DebugSessionCreationReasonType

  clientId?: string

  shortId: string
  workspace: string
  project: string
  continuousDebugSession?: string
  name: string
  startedAt: string | Date
  stoppedAt: string | Date
  durationInSeconds?: number
  createdAt: string | Date
  updatedAt: string | Date
  tags: ITag[]

  issues?: IDebugSessionIssue[]

  resourceAttributes?: {
    browserInfo?: string,
    cookiesEnabled?: string,
    deviceInfo?: string,
    hardwareConcurrency?: string,
    osInfo?: string,
    pixelRatio?: string,
    screenSize?: string,
  } & object

  sessionAttributes?: {
    userEmail?: string
    userId?: string,
    userName?: string,
    accountId?: string,
    accountName?: string,

    comment?: string
  } & object

  userAttributes: IEndUserAttributes
  endUserHash?: string

  socketId?: string

  views: IDebugSessionView[]
  starred: boolean
  starredItems: string[]
  s3Files: {
    _id?: string
    bucket: string
    key: string
    dataType: DebugSessionDataType
    url?: string
    totalCount?: number
  }[]
  finishedS3Transfer?: boolean
  tempApiKey?: string

  url?: string
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

export enum OtelScope {
  http = '@opentelemetry/instrumentation-http',
  fetch = '@opentelemetry/instrumentation-fetch',
  httpXmlRequest = '@opentelemetry/instrumentation-xml-http-request',
  documentLoad = '@opentelemetry/instrumentation-document-load',
  userInteraction = '@opentelemetry/instrumentation-user-interaction',
  multiplayerNotebookHttp = '@multiplayer/notebook-http',
  navigation = 'navigation',
  exception = 'exception',
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
  'Events.Timestamp': string[];
  'Events.Name': string[];
  'Events.Attributes': Record<string, any>[];
  'Links.TraceId': string[];
  'Links.SpanId': string[];
  'Links.TraceState': string[];
  'Links.Attributes': Record<string, any>[];
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
