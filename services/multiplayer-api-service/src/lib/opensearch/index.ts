import { EntityIndex } from './entity-index'

export * from './entity-index'
import { default as client } from './opensearch'
import logger from '@multiplayer/logger'
export { default as client } from './opensearch'

export async function init() {
  try {
    await EntityIndex.createIndex()
  } catch (err) {
    logger.error('Cannot init opensearch data', err)
    throw err
  }
}

export async function ping(): Promise<boolean> {
  try {
    const resp = await client.ping(undefined, { requestTimeout: 3000 })
    return resp.body
  } catch (err) {
    logger.error(err)
    return false
  }
}
