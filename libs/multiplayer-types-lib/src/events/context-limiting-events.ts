export enum ContextLimitingEvents {
  THREAD_SUBSCRIBE = 'v0/thread/subscribe',
  THREAD_UNSUBSCRIBE = 'v0/thread/unsubscribe',
  BRANCH_SUBSCRIBE = 'v0/branch/subscribe',
  BRANCH_UNSUBSCRIBE = 'v0/branch/unsubscribe'
}

export type ContextLimitingClientEventsMap = {
  [ContextLimitingEvents.BRANCH_SUBSCRIBE]: (branchId: string) => void
  [ContextLimitingEvents.BRANCH_UNSUBSCRIBE]: (branchId: string) => void
  [ContextLimitingEvents.THREAD_SUBSCRIBE]: (threadId: string) => void
  [ContextLimitingEvents.THREAD_UNSUBSCRIBE]: (threadId: string) => void
}
