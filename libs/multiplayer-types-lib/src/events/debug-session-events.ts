import { SessionType } from '@multiplayer-app/session-recorder-common'
import { IDebugSession } from '../debug-session'
import { IDebugSessionRrwebEvent } from '../debug-session-rrweb-event'
import { OtelLogCh } from '../otlp-log-ch'
import { OtelSpanCh } from '../otlp-span-ch'

export enum DebugSessionEvents {
  DEBUG_SESSION_UPDATED = 'debug-session:updated',
  DEBUG_SESSION_CANCELED = 'debug-session:cancelled',
  DEBUG_SESSION_AUTO_CREATED = 'debug-session:auto-created',
  DEBUG_SESSION_SUBSCRIBE_PROJECT = 'debug-session:workspace:project:subscribe',
  DEBUG_SESSION_UNSUBSCRIBE_PROJECT = 'debug-session:workspace:project:unsubscribe',
  DEBUG_SESSION_DATA_SUBSCRIBE = 'debug-session:data:subscribe',
  DEBUG_SESSION_DATA_UNSUBSCRIBE = 'debug-session:data:unsubscribe',
  DEBUG_SESSION_OTEL_TRACE_CREATED = 'debug-session:otel-traces:created',
  DEBUG_SESSION_OTEL_LOG_CREATED = 'debug-session:otel-logs:created',
  DEBUG_SESSION_RRWEB_EVENT_CREATED = 'debug-session:rrweb-event:created',
}

export interface DebugSessionUpdatedResponseParams {
  data: IDebugSession
}

export interface DebugSessionCanceledResponseParams {
  data: IDebugSession
}

export interface DebugSessionAutoCreatedResponseParams {
  data: IDebugSession
}

export interface DebugSessionSubscribeProjectRequestParams {
  workspaceId: string,
  projectId: string
}

export interface DebugSessionUnsubscribeProjectRequestParams {
  workspaceId: string,
  projectId: string
}

export interface DebugSessionSubscribeDataRequestParams {
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  debugSessionType?: SessionType,
}

export interface DebugSessionUnsubscribeDataRequestParams {
  debugSessionId: string
}

export interface DebugSessionOtelTraceCreatedResponseParams {
  debugSessionId: string
  data: OtelSpanCh[]
}

export interface DebugSessionOtelLogCreatedResponseParams {
  debugSessionId: string
  data: OtelLogCh[]
}

export interface DebugSessionRrwebEventCreatedResponseParams {
  debugSessionId: string
  data: IDebugSessionRrwebEvent
}


export type DebugSessionEventsMap = {
  [DebugSessionEvents.DEBUG_SESSION_UPDATED]: {
    requestParams: void
    responseParams: DebugSessionUpdatedResponseParams
  }
  [DebugSessionEvents.DEBUG_SESSION_CANCELED]: {
    requestParams: void
    responseParams: DebugSessionCanceledResponseParams
  }
  [DebugSessionEvents.DEBUG_SESSION_AUTO_CREATED]: {
    requestParams: DebugSessionAutoCreatedResponseParams
    responseParams: void
  }
  [DebugSessionEvents.DEBUG_SESSION_SUBSCRIBE_PROJECT]: {
    requestParams: DebugSessionSubscribeProjectRequestParams
    responseParams: void
  }
  [DebugSessionEvents.DEBUG_SESSION_UNSUBSCRIBE_PROJECT]: {
    requestParams: DebugSessionUnsubscribeProjectRequestParams
    responseParams: void
  }
  [DebugSessionEvents.DEBUG_SESSION_DATA_SUBSCRIBE]: {
    requestParams: DebugSessionSubscribeDataRequestParams
    responseParams: void
  }
  [DebugSessionEvents.DEBUG_SESSION_DATA_UNSUBSCRIBE]: {
    requestParams: DebugSessionUnsubscribeDataRequestParams
    responseParams: void
  }
  [DebugSessionEvents.DEBUG_SESSION_OTEL_TRACE_CREATED]: {
    requestParams: void
    responseParams: DebugSessionOtelTraceCreatedResponseParams
  }
  [DebugSessionEvents.DEBUG_SESSION_OTEL_LOG_CREATED]: {
    requestParams: void
    responseParams: DebugSessionOtelLogCreatedResponseParams
  }
  [DebugSessionEvents.DEBUG_SESSION_RRWEB_EVENT_CREATED]: {
    requestParams: void
    responseParams: DebugSessionRrwebEventCreatedResponseParams
  }
}
