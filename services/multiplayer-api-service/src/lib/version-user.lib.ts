import { NotFoundError } from 'restify-errors'
import {
  UserModel,
  IWorkspaceUserDocument,
  IUserDocument,
  WorkspaceUserModel,
} from '@multiplayer/models'
import type { ObjectId } from '@multiplayer/mongo'
import { Username } from '@multiplayer/util-shared'

export const getUserById = async (userId: string | ObjectId) => {
  const user = await UserModel.findUserById(userId)

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return user
}

export const inviteWorkspaceUserByEmail = async (
  email: string,
  workspaceId: string,
): Promise<IWorkspaceUserDocument> => {
  let user: IUserDocument

  user = await UserModel.findByPrimaryEmail(email)

  if (!user) {
    user = await UserModel.createWithoutProfile(
      email,
      {
        profiles: {
          local: {
            isEmailConfirmed: true,
          },
        },
        enabled: true,
      },
    )
  }

  let workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
    user._id,
    workspaceId,
  )

  if (!workspaceUser) {
    workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
      workspace: workspaceId,
      user: user._id,
      username: Username.getUsernameFromEmail(user.primaryEmail),
      firstName: user.firstName,
      lastName: user.lastName,
    })
  }

  return workspaceUser
}
