import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'

export const fetchIntegrationById = async (
  workspaceId,
  integrationId,
): Promise<IIntegrationDocument> => {
  const integration = await IntegrationModel.findIntegrationByIdInWorkspace(
    integrationId,
    workspaceId,
  )

  if (!integration) {
    throw new NotFoundError(ErrorMessage.INTEGRATION_NOT_FOUND)
  }

  return integration
}
