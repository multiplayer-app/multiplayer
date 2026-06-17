import { ProjectState, UserState } from '../project-state'

export enum PresenceEvents {
  INIT_STATE = 'v0/project/initState',
  USER_JOINED_PROJECT = 'v0/project/userJoined',
  USER_LEFT_PROJECT = 'v0/project/userLeft',
  USER_JOINED_ENTITY = 'v0/entity/userJoined',
  USER_LEFT_ENTITY = 'v0/entity/userLeft',
}

export interface PresenceEventsMap {
  [PresenceEvents.INIT_STATE]: (state: ProjectState) => void;
  [PresenceEvents.USER_JOINED_PROJECT]: (user: UserState) => void;
  [PresenceEvents.USER_LEFT_PROJECT]: (userId: string) => void;
  [PresenceEvents.USER_JOINED_ENTITY]: (user: UserState, entityId: string, branchId: string) => void;
  [PresenceEvents.USER_LEFT_ENTITY]: (userId: string, entityId: string, branchId: string) => void;
}

