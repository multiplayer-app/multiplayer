import { Types } from 'mongoose'
import { IWorkspaceMember } from '@multiplayer/types'
import { fetch } from '@multiplayer/fetch'
import { API_SERVICE_URL } from '../config'

export const inviteUsersToWorkspace = async (
  cookie,
  workspaceId: string | Types.ObjectId,
  emails: string[],
  sendEmail?: boolean,
  addToWorkspace?: boolean,
): Promise<IWorkspaceMember[]> => {
  const payload: any = {
    emails,
    addToWorkspace,
  }

  if (typeof sendEmail === 'boolean') {
    payload.sendEmail = sendEmail
  }

  const { data: invitedWorkspaceUsers } = await fetch.post(
    `${API_SERVICE_URL}/workspaces/${workspaceId}/users`,
    payload,
    {
      headers: {
        Cookie: cookie,
      },
    },
  )

  return invitedWorkspaceUsers
}
