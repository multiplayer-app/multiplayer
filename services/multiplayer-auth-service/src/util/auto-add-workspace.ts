import {
  WorkspaceModel,
  IUserDocument,
  WorkspaceUserModel,
  RoleModel,
} from '@multiplayer/models'
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator'
import { RoleType, WorkspaceUserStatus } from '@multiplayer/types'
import { isFreeEmail, Username, slugifyString } from '@multiplayer/util-shared'
import { AccessControlContext } from '@multiplayer/auth'
import logger from '@multiplayer/logger'
import { INTERNAL_API_SERVICE_URL } from '../config'

const generateRandomWorkspaceName = (): string =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    style: 'capital',
  })

const createWorkspaceForUser = async (
  user: IUserDocument,
  name: string,
): Promise<void> => {
  const response = await fetch(`${INTERNAL_API_SERVICE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user._id.toString(),
      name,
      handle: slugifyString(name),
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to auto-create workspace: ${response.status} ${body}`)
  }

  logger.info(
    { user: user._id, name },
    'Auto created workspace for new user',
  )
}

export default async (user: IUserDocument): Promise<void> => {
  if (isFreeEmail(user.primaryEmail)) {
    const workspaceName = generateRandomWorkspaceName()
    await createWorkspaceForUser(user, workspaceName)
    return
  }

  const domain = user.primaryEmail.split('@')[1]
  const workspaces = await WorkspaceModel.findWorkspacesByDomain(domain, { domainAutoJoin: true })

  if (!workspaces.length) {
    const companySlug = domain.match(/^([^.]+)/)?.[1] ?? domain
    const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1)
    const name = `${companyName}'s Workspace`
    await createWorkspaceForUser(user, name)
    return
  }

  const defaultWorkspaceRole = await RoleModel.findDefaultRole(RoleType.WORKSPACE)

  await Promise.all(workspaces.map(async (workspace) => {
    const roleId = workspace.settings?.domainAutoJoin?.workspaceRoleId ?? defaultWorkspaceRole._id

    const workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
      workspace: workspace._id,
      user: user._id,
      username: Username.getUsernameFromEmail(user.primaryEmail),
      firstName: user.firstName,
      lastName: user.lastName,
      status: WorkspaceUserStatus.ACTIVE,
    })

    await WorkspaceModel.addUsers(
      workspace._id,
      [workspaceUser._id],
      roleId,
    )
  }))

  await AccessControlContext.invalidateContext({
    userId: user._id.toString(),
  })

  if (workspaces.length) {
    logger.info(
      {
        workspaces: workspaces.map(({ _id }) => _id.toString()),
        user: user._id,
      },
      'Auto added user to workspaces',
    )
  }
}
