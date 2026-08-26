import { LinearClient } from '@linear/sdk'

export const getStatuses = async (
  accessToken: string,
): Promise<{ _id: string, name: string, description?: string }[]> => {
  const linearClient = new LinearClient({
    accessToken,
  })

  const statuses = await linearClient.workflowStates()

  return statuses.nodes.map(status => ({
    _id: status.id,
    name: status.name,
    description: status.description,
  }))
}

export const getTicket = async (
  accessToken: string,
  ticketNumber: string,
): Promise<any> => {
  const linearClient = new LinearClient({
    accessToken,
  })

  const ticket = await linearClient.issue(ticketNumber)

  return ticket
}

export const updateTicketStatus = async (
  accessToken: string,
  ticketNumber: string,
  statusId: string,
): Promise<any> => {
  const linearClient = new LinearClient({
    accessToken,
  })

  const issue = await linearClient.issue(ticketNumber)

  await issue.update({ stateId: statusId })
}
