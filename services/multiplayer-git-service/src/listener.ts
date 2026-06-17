import { IntegrationModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import {
  IntegrationTypeEnum,
  CollaborationAMQPMessageType,
  ProjectBranchUpdatedEventMessage,
} from '@multiplayer/types'
import {
  AtlassianApi,
  LinearApi,
} from './libs'

const handleProjectBranchUpdate = async (message: ProjectBranchUpdatedEventMessage) => {
  const {
    variables: {
      projectBranch: {
        status: projectBranchStatus,
        name: projectBranchName,
        workspace: workspaceId,
      },
    },
  } = message

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
      logger.error({ err, ticketNumber }, '[LISTENER] Failed to update ticket status')
    }
  }
}

export const AmqpEventListener = async (message: {
  type: CollaborationAMQPMessageType,
  variables: any,
}) => {
  if (message.type === CollaborationAMQPMessageType.PROJECT_BRANCH_UPDATE) {
    await handleProjectBranchUpdate(message as ProjectBranchUpdatedEventMessage)
  }
}
