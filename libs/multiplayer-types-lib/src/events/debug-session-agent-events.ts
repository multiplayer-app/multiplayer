import { SessionType } from '@multiplayer-app/session-recorder-common'
import { IEndUser } from '../end-user'

export enum DebugSessionAgentEvents {
  REMOTE_SESSION_RECORDING_START = 'debug-session:remote:start',
  REMOTE_SESSION_RECORDING_STOP = 'debug-session:remote:stop',
  /**
   * @deprecated Use DEBUG_SESSION_RRWEB_EVENT_CREATED instead
   */
  DEBUG_SESSION_RRWEB_EVENT_CREATE_DEPRECATED = 'debug-session:rrweb:add-event',
  DEBUG_SESSION_RRWEB_EVENT_CREATE = 'debug-session:rrweb-event:create',

  DEBUG_SESSION_SAVE_BUFFER_EVENT = 'debug-session:save-buffer',
  SET_USER_EVENT = 'socket:set-user',

  DEBUG_SESSION_SUBSCRIBE = 'debug-session:subscribe',
  DEBUG_SESSION_UNSUBSCRIBE = 'debug-session:unsubscribe',

  DEBUG_SESSION_STARTED = 'debug-session:started',
  DEBUG_SESSION_STOPPED = 'debug-session:stopped',

  READY = 'ready'
}

export interface DebugSessionAgentStartedRequestParams {
  debugSessionId: string,
}

export interface DebugSessionAgentStoppedResponseParams {
  debugSessionId: string,
}

export interface DebugSessionAgentRemoteStartResponseParams {}

export interface DebugSessionAgentRemoteStopResponseParams {}

export interface DebugSessionAgentRrwebEventCreateRequestParams {
  workspace: string,
  project: string,
  debugSessionId: string,
  eventType: number,
  event: string,
  timestamp: string,
  debugSessionType: SessionType,
}

export interface DebugSessionAgentSaveBufferResponseParams {
  debugSession: {
    _id: string
  },
}

export type DebugSessionAgentSetUserRequestParams = IEndUser['attributes']
| { userAttributes: IEndUser['attributes'], clientId?: string }
| null

export interface DebugSessionAgentSubscribeRequestParams {
  workspaceId: string,
  projectId: string,
  debugSessionId: string,
  debugSessionType?: SessionType,
}

export interface DebugSessionAgentUnsubscribeRequestParams {
  debugSessionId: string
}

export interface DebugSessionAgentReadyResponseParams {
  ready: boolean
}

export type DebugSessionAgentEventsMap = {
  [DebugSessionAgentEvents.DEBUG_SESSION_STARTED]: {
    requestParams: DebugSessionAgentStartedRequestParams
    responseParams: void
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_STOPPED]: {
    requestParams: DebugSessionAgentStoppedResponseParams
    responseParams: void
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE_DEPRECATED]: {
    requestParams: void
    responseParams: DebugSessionAgentRrwebEventCreateRequestParams
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_RRWEB_EVENT_CREATE]: {
    requestParams: DebugSessionAgentRrwebEventCreateRequestParams
    responseParams: void
  }
  [DebugSessionAgentEvents.REMOTE_SESSION_RECORDING_START]: {
    requestParams: void
    responseParams: DebugSessionAgentRemoteStartResponseParams
  }
  [DebugSessionAgentEvents.REMOTE_SESSION_RECORDING_STOP]: {
    requestParams: void
    responseParams: DebugSessionAgentRemoteStopResponseParams
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_SAVE_BUFFER_EVENT]: {
    requestParams: void
    responseParams: DebugSessionAgentSaveBufferResponseParams
  }
  [DebugSessionAgentEvents.SET_USER_EVENT]: {
    requestParams: DebugSessionAgentSetUserRequestParams
    responseParams: void
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_SUBSCRIBE]: {
    requestParams: DebugSessionAgentSubscribeRequestParams
    responseParams: void
  }
  [DebugSessionAgentEvents.DEBUG_SESSION_UNSUBSCRIBE]: {
    requestParams: DebugSessionAgentUnsubscribeRequestParams
    responseParams: void
  }
  [DebugSessionAgentEvents.READY]: {
    requestParams: void
    responseParams: DebugSessionAgentReadyResponseParams
  }
}
