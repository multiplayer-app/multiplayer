import { NotFoundError } from 'restify-errors'
import {
  UserModel,
  TokenModel,
  IUserDocument,
  WorkspaceUserModel,
  IWorkspaceUserDocument,
  TeamModel,
  WorkspaceModel,
  IRoleDocument,
} from '@multiplayer/models'
import AMQP from '@multiplayer/amqp'
import { AccessControlContext } from '@multiplayer/auth'
import { Username } from '@multiplayer/util-shared'
import {
  TokenTypeEnum,
  IWorkspaceMember,
  RoleType,
  WorkspaceUserStatus,
} from '@multiplayer/types'
import { Types } from 'mongoose'
import { AMQP_NOTIFICATION_QUEUE } from '../config'
import * as RoleLib from './role.lib'

export const inviteUser = async (
  currentWorkspaceUserId: Types.ObjectId | string,
  email: string,
  workspaceId: Types.ObjectId | string,
  teamIds?: Types.ObjectId[] | string[],
  workspaceRoleId?: Types.ObjectId | string,
  projectRoleId?: Types.ObjectId | string,
  sendEmail?: boolean,
  addToWorkspace = true,
): Promise<IWorkspaceMember> => {
  let workspaceRole: IRoleDocument
  let projectRole: IRoleDocument

  if (workspaceRoleId) {
    workspaceRole = await RoleLib.fetchRoleById(workspaceRoleId, RoleType.WORKSPACE)
  } else {
    workspaceRole = await RoleLib.fetchDefaultRole(RoleType.WORKSPACE)
  }

  if (projectRoleId) {
    projectRole = await RoleLib.fetchRoleById(projectRoleId, RoleType.PROJECT)
  } else {
    projectRole = await RoleLib.fetchDefaultRole(RoleType.PROJECT)
  }

  if (!projectRole) {
    throw new NotFoundError('Project role not found')
  }

  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  let user: IUserDocument

  user = await UserModel.findByPrimaryEmail (email)

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
  let addedToWorkspace = false

  if (workspaceUser) {
    addedToWorkspace = !!(workspace?.users.find(
      (workspaceMember) => (workspaceUser as IWorkspaceUserDocument)._id
        .equals(workspaceMember.workspaceUser as string)))

    if (!addedToWorkspace) {
      await WorkspaceUserModel.updateWorkspaceUser(
        workspaceUser.user,
        workspaceId,
        {
          status: WorkspaceUserStatus.PENDING,
        },
      )
    } else if (sendEmail && workspaceUser.status === WorkspaceUserStatus.PENDING) {
      await sendJoinWorkspaceInvitation(
        workspaceId,
        workspaceUser._id,
        workspaceUser.user,
        currentWorkspaceUserId,
      )
    }
  } else {
    workspaceUser = await WorkspaceUserModel.createWorkspaceUser({
      workspace: workspaceId,
      user: user._id,
      username: Username.getUsernameFromEmail(user.primaryEmail),
      firstName: user.firstName,
      lastName: user.lastName,
    })
    addedToWorkspace = false
  }

  if (!addedToWorkspace && addToWorkspace) {
    await WorkspaceModel.addUsers(
      workspaceId,
      [workspaceUser._id],
      workspaceRole._id,
    )

    if (sendEmail) {
      await sendJoinWorkspaceInvitation(
        workspaceId,
        workspaceUser._id,
        workspaceUser.user,
        currentWorkspaceUserId,
      )
    }
  }

  if (teamIds?.length) {
    const teams = await TeamModel.findTeamByIds(
      teamIds,
      {
        workspace: workspaceId,
      },
    )

    await Promise.all(teams.map(async team => {
      const addedToTeam = team.users.find(
        (teamMember) => (workspaceUser as IWorkspaceUserDocument)._id.equals(teamMember.workspaceUser as string))

      if (!addedToTeam) {
        await TeamModel.addUsers(
          team._id,
          [(workspaceUser as IWorkspaceUserDocument)._id],
          projectRole._id,
        )
      }
    }))
  }

  const [workspaceMember] = await WorkspaceModel.getWorkspaceMembersByWorkspaceUserIds(
    workspaceId,
    [(workspaceUser as IWorkspaceUserDocument)._id],
  )

  await AccessControlContext.invalidateContext({
    workspaceId: workspaceId.toString(),
    userId: user._id.toString(),
  })

  return workspaceMember
}

export const sendJoinWorkspaceInvitation = async (
  workspaceId: string | Types.ObjectId,
  workspaceUserId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  inviterWorkspaceUserId: string | Types.ObjectId,
) => {
  const user = await UserModel.findUserById(userId)

  if (!user) {
    throw new NotFoundError('User not found')
  }

  const token = await TokenModel.createToken(
    TokenTypeEnum.USER_WORKSPACE_INVITATION,
    userId,
    {
      meta: {
        workspaceUser: workspaceUserId,
        workspace: workspaceId,
        inviterWorkspaceUser: inviterWorkspaceUserId,
      },
    },
  )

  const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

  if (!workspace) {
    throw new NotFoundError('Workspace not found')
  }

  const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(workspaceUserId)
  const inviterWorkspaceUser = await WorkspaceUserModel.findWorkspaceUserById(inviterWorkspaceUserId)
  const inviterUser = await UserModel.findUserById(inviterWorkspaceUser?.user as string)

  await AMQP.publish(
    AMQP_NOTIFICATION_QUEUE,
    {
      variables: {
        template: 'USER_WORKSPACE_INVITATION',
        email: user.primaryEmail,
        data: {
          email: user.primaryEmail,
          token: token.token,
          user,
          workspace,
          workspaceUser,
          inviteeUser: inviterUser,
          inviteeWorkspaceUser: inviterWorkspaceUser,
        },
      },
    },
  )
}
