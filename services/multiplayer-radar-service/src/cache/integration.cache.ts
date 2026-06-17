import NodeCache from 'node-cache'
import { IIntegration } from '@multiplayer/types'

const integrationCache = new NodeCache({ stdTTL: 10 })


export const set = (
  integrationId: string,
  integration: IIntegration,
): void => {
  integrationCache.set(
    integrationId,
    integration,
  )
}


export const get = (integrationId: string): IIntegration | undefined => {
  return integrationCache.get(integrationId)
}
