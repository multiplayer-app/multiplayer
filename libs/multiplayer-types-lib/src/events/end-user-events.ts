import { IEndUser } from '../end-user'

export enum EndUserEvents {
  END_USER_CONNECTED_EVENT = 'end-user:connected',
  END_USER_CONNECTION_STATE_UPDATE_EVENT = 'end-user:connection-state-updated',
  END_USER_SUBSCRIBE_PROJECT = 'end-user:workspace:project:subscribe',
  END_USER_UNSUBSCRIBE_PROJECT = 'end-user:workspace:project:unsubscribe',
}

export interface EndUserSubscribeProjectParams {
  workspaceId: string,
  projectId: string
}

export interface EndUserUnsubscribeProjectParams {
  workspaceId: string,
  projectId: string
}

export interface EndUserConnectedResponseParams {
  data: IEndUser
}

export interface EndUserConnectionStateUpdateResponseParams {
  data: IEndUser
}

export type EndUserEventsMap = {
  [EndUserEvents.END_USER_SUBSCRIBE_PROJECT]: {
    requestParams: EndUserSubscribeProjectParams
    responseParams: void
  }
  [EndUserEvents.END_USER_UNSUBSCRIBE_PROJECT]: {
    requestParams: EndUserUnsubscribeProjectParams
    responseParams: void
  }
  [EndUserEvents.END_USER_CONNECTED_EVENT]: {
    requestParams: void
    responseParams: EndUserConnectedResponseParams
  }
  [EndUserEvents.END_USER_CONNECTION_STATE_UPDATE_EVENT]: {
    requestParams: void
    responseParams: EndUserConnectionStateUpdateResponseParams
  }
}
