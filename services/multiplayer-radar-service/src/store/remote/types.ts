// Shared between remote.store.ts (follower - sends requests) and leader-listener.ts
// (leader - dispatches them to localStore). select/countTotal/insert/remove/
// moveDataToS3 mirror IAnalyticsStore 1:1; selectStream has no RPC op of its own - see
// the comment in remote.store.ts for why.
export type StoreRpcOp = 'select' | 'countTotal' | 'insert' | 'remove' | 'moveDataToS3'

export interface StoreRpcRequest {
  op: StoreRpcOp
  args: unknown[]
}
