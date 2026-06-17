import redis from '@multiplayer/redis'
import { IWorkspaceBillingFeature } from '@multiplayer/types'
import { WorkspaceModel } from '@multiplayer/models'
import {
  REDIS_WORKSPACE_FEATURE_KEY_PREFIX,
  REDIS_WORKSPACE_FEATURE_TTL,
} from '../config'

const getKey = (workspaceId) => `${REDIS_WORKSPACE_FEATURE_KEY_PREFIX}:${workspaceId}`

export const get = async (workspaceId: string): Promise<IWorkspaceBillingFeature[]> => {
  const key = getKey(workspaceId)

  let billingFeatures = await redis.get(key) as IWorkspaceBillingFeature[] | undefined

  if (!billingFeatures) {
    const workspace = await WorkspaceModel.findWorkspaceById(
      workspaceId,
      { 'billing.stripe.features': 1 },
    )

    billingFeatures = JSON.parse(JSON.stringify(workspace?.billing.stripe.features || []))

    await redis.set(
      key,
      billingFeatures,
      REDIS_WORKSPACE_FEATURE_TTL,
    )
  }

  return billingFeatures || []
}

// export const set = async (
//   workspaceId,
//   billingFeatures: IWorkspaceBillingFeature[],
// ): Promise<void> => {
//   const key = getKey(workspaceId)

//   await redis.set(
//     key,
//     billingFeatures,
//     REDIS_WORKSPACE_FEATURE_TTL,
//   )
// }

export const del = async (workspaceId): Promise<void> => {
  const key = getKey(workspaceId)

  await redis.del(key)
}
