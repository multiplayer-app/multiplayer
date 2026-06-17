import NodeCache from 'node-cache'
import { FeatureFlag } from '@multiplayer/types'

const workspaceFlowFeatureCache = new NodeCache({ stdTTL: 60 })

const getKey = (workspaceId: string, feature: FeatureFlag): string => {
  return `${workspaceId}:${feature}`
}

export const get = (workspaceId: string, feature: FeatureFlag): boolean | undefined => {
  const featureEnabled = workspaceFlowFeatureCache.get(getKey(workspaceId, feature)) as boolean | undefined

  return featureEnabled
}

export const set = (workspaceId: string, feature: FeatureFlag, enabled: boolean): void => {
  workspaceFlowFeatureCache.set(getKey(workspaceId, feature), enabled)
}
