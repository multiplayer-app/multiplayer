import {
  WorkspaceModel,
  IUserDocument,
  WorkspaceUserModel,
  RoleModel,
} from '@multiplayer/models'
import { RoleType } from '@multiplayer/types'
import { isFreeEmail, Username } from '@multiplayer/util-shared'
import logger from '@multiplayer/logger'

export default async (user: IUserDocument) => {
  if (isFreeEmail(user.primaryEmail)) {
    return
  }

  const domain = user.primaryEmail.split('@')[1]

  const workspaces = await WorkspaceModel.findWorkspacesByDomain(domain)
  const defaultWorkspaceRole = await RoleModel.findDefaultRole(RoleType.WORKSPACE)

  await Promise.all(workspaces.map(async (workspace) => {
    const workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
      workspace: workspace._id,
      user: user._id,
      username: Username.getUsernameFromEmail(user.primaryEmail),
      firstName: user.firstName,
      lastName: user.lastName,
    })

    await WorkspaceModel.addUsers(
      workspace._id,
      [workspaceUser._id],
      defaultWorkspaceRole._id,
    )
  }))

  logger.info(
    {
      workspaces: workspaces.map(({ _id }) => _id),
      user: user._id,
    },
    'Auto added user to workspaces',
  )
}
