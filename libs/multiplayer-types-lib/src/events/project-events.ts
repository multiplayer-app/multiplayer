import { EntityEventsMap, EntityServerEventsMap } from './entity-events'
import { PresenceEventsMap } from './project-presence-events'
import { CommentsClientEventsMap, CommentsServerEventsMap } from './comment-events'
import { ContextLimitingClientEventsMap } from './context-limiting-events'
import { WarningEventsServerMap } from './warning-events'
import { BranchEventsClientMap, BranchEventsServerMap } from './branch-events'

export type ProjectClientEventsMap =
  EntityEventsMap &
  CommentsClientEventsMap &
  ContextLimitingClientEventsMap &
  BranchEventsClientMap;

export type ProjectServerEventsMap =
  PresenceEventsMap &
  EntityServerEventsMap &
  CommentsServerEventsMap &
  WarningEventsServerMap &
  BranchEventsServerMap;
