import { IntegrationModel, IIntegrationDocument } from '@multiplayer/models'
import { IIntegration } from '@multiplayer/types'
import { IntegrationCache } from '../cache'

export const findById = async (integrationId: string): Promise<IIntegrationDocument | undefined> => {
  const cachedIntegration = await IntegrationCache.get(integrationId)

  if (cachedIntegration) {
    return cachedIntegration as unknown as IIntegrationDocument
  }

  const integration = await IntegrationModel.findIntegrationById(integrationId)

  if (!integration) {
    return undefined
  }

  const _integration = integration.toObject()

  await IntegrationCache.set(
    integrationId,
    _integration as unknown as IIntegration,
  )

  return _integration
}
