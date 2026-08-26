import fetch from './fetch'
import {
  ATLASSIAN_APP_ID,
  ATLASSIAN_APP_SECRET,
} from '../config'

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string, refreshToken: string }> => {
  const response = await fetch({
    method: 'POST',
    url: 'https://auth.atlassian.com/oauth/token',
    headers: {
      'content-type': 'application/json',
    },
    data: {
      grant_type: 'refresh_token',
      client_id: ATLASSIAN_APP_ID,
      client_secret: ATLASSIAN_APP_SECRET,
      refresh_token: refreshToken,
    },
  })

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
  }
}

export const getOrgs = async (
  accessToken: string,
): Promise<{ _id: string, name: string }[]> => {
  const response = await fetch(
    'https://api.atlassian.com/oauth/token/accessible-resources',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  )

  const data = response.data.map(({ id, name }) => ({
    _id: id,
    name,
  }))

  return data
}

export const getStatuses = async (
  accessToken: string,
  orgId: string,
): Promise<{ _id: string, name: string, description: string }[]> => {
  const token = `Bearer ${accessToken}`

  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${orgId}/rest/api/3/statuses/search`,
    {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    },
  )

  const statuses = response.data.values.map(status => ({
    _id: status.id,
    name: status.name,
    description: status.description,
  }))

  return statuses
}

export const getTicket = async (
  accessToken: string,
  orgId: string,
  ticketNumber: string,
): Promise<any> => {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${orgId}/rest/api/3/issue/${ticketNumber}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  )

  return response.data
}

export const updateTicketStatus = async (
  accessToken: string,
  orgId: string,
  ticketNumber: string,
  statusId: string,
): Promise<any> => {
  const response = await fetch(
    `https://api.atlassian.com/ex/jira/${orgId}/rest/api/3/issue/${ticketNumber}/transitions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      data: {
        transition: {
          id: statusId,
        },
      },
    },
  )

  return response.data
}
