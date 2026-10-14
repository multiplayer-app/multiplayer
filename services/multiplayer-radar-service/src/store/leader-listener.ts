import AMQP from '@multiplayer/amqp'
import logger from '@multiplayer/logger'
import { AMQP_STORE_RPC_QUEUE } from '../config'
import { localStore } from './index'
import type { StoreRpcRequest, StoreRpcOp } from './remote/types'

// Leader-side handler for the store RPC queue (see remote.store.ts). Started on
// leadership gain, stopped on loss (src/app.ts leadership hooks) - only the current
// leader is ever consuming this queue, so a request is only ever delivered to whichever
// replica can actually serve it. Dispatches straight to localStore, never to the Store
// facade, which structurally rules out a forward loop.
//
// Every handler must resolve to an object (or void) - the amqp lib's reply serializer
// (formatOutputData) only knows how to Buffer.from() an object/array; a bare primitive
// like countTotal's number return throws Buffer.from()'s own ERR_INVALID_ARG_TYPE deep
// inside the lib, so it's wrapped here rather than returned raw.
const handlers: Record<StoreRpcOp, (args: unknown[]) => Promise<unknown>> = {
  select: ([table, filter, cursor, selectFields, join, groupBy, sortOptions]: any) =>
    localStore.select(table, filter, cursor, selectFields, join, groupBy, sortOptions),
  countTotal: async ([table, filter, join]: any) => ({
    count: await localStore.countTotal(table, filter, join),
  }),
  insert: ([table, data, asyncInsert]: any) =>
    localStore.insert(table, data, asyncInsert),
  remove: ([table, filter]: any) =>
    localStore.remove(table, filter),
  moveDataToS3: ([absoluteS3FileUrl, table, filter, s3AccessKeyId, secretAccessKey, replace, sessionToken]: any) =>
    localStore.moveDataToS3(absoluteS3FileUrl, table, filter, s3AccessKeyId, secretAccessKey, replace, sessionToken),
}

const handleRequest = async ({ op, args }: StoreRpcRequest): Promise<unknown> => {
  const handler = handlers[op]

  if (!handler) {
    throw new Error(`[STORE-LEADER] Unknown store RPC op: ${op}`)
  }

  return handler(args)
}

let listening = false

export const start = async (): Promise<void> => {
  if (listening) {
    return
  }

  listening = true

  await AMQP.listen(AMQP_STORE_RPC_QUEUE, handleRequest, {
    durable: false,
    prefetch: 10,
  })

  logger.info('[STORE-LEADER] Listening for store RPC requests')
}

export const stop = async (): Promise<void> => {
  if (!listening) {
    return
  }

  listening = false

  await AMQP.stopListening(AMQP_STORE_RPC_QUEUE)
}
