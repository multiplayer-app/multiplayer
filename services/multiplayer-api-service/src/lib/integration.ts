import {
  IntegrationModel,
  IIntegrationDocument,
} from '@multiplayer/models'
import {
  ErrorMessage,
  IntegrationTypeEnum,
  IProjectBranch,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import logger from '@multiplayer/logger'
import * as AtlassianApi from './atlassian'
import * as LinearApi from './linear'

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

export const syncProjectBranchTicketStatus = async (
  projectBranch: Pick<IProjectBranch, 'status' | 'name' | 'workspace'>,
) => {
  const {
    status: projectBranchStatus,
    name: projectBranchName,
    workspace: workspaceId,
  } = projectBranch

  const { data: integrations } = await IntegrationModel.findIntegrations({
    workspace: workspaceId,
    type: [
      IntegrationTypeEnum.ATLASSIAN,
      IntegrationTypeEnum.LINEAR,
    ],
  })

  const ticketNumber = projectBranchName.split(':')[0]

  if (!ticketNumber) {
    return
  }

  for (const integration of integrations) {
    try {
      if (
        integration.type === IntegrationTypeEnum.ATLASSIAN
        && integration.atlassian?.ticketStatusMapping?.length
      ) {
        const ticket = await AtlassianApi.getTicket(
          integration.atlassian?.accessToken as string,
          integration.atlassian?.orgId as string,
          ticketNumber,
        )

        if (ticket) {
          const status = integration.atlassian?.ticketStatusMapping.find(mapping => projectBranchStatus === mapping.projectBranchStatus)
          if (status) {
            await AtlassianApi.updateTicketStatus(
              integration.atlassian?.accessToken as string,
              integration.atlassian?.orgId as string,
              ticketNumber,
              status.ticketStatus,
            )
          }
        }
      } else if (
        integration.type === IntegrationTypeEnum.LINEAR
        && integration.linear?.ticketStatusMapping?.length
      ) {
        const ticket = await LinearApi.getTicket(
          integration.linear?.accessToken as string,
          ticketNumber,
        )

        if (ticket) {
          const status = integration.linear?.ticketStatusMapping.find(mapping => projectBranchStatus === mapping.projectBranchStatus)
          if (status) {
            await LinearApi.updateTicketStatus(
              integration.linear?.accessToken as string,
              ticketNumber,
              status.ticketStatus,
            )
          }
        }
      }
    } catch (err) {
      logger.error({ err, ticketNumber }, '[INTEGRATION] Failed to update ticket status')
    }
  }
}
