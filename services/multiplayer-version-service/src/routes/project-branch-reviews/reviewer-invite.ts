import type { Request, Response, NextFunction } from 'express'
import { Config as AuthConfig } from '@multiplayer/auth'
import AMQP from '@multiplayer/amqp'
import {
  ProjectBranchModel,
  WorkspaceUserModel,
  TokenModel,
  UserModel,
} from '@multiplayer/models'
import type { IWorkspaceUserDocument } from '@multiplayer/models'
import {
  IWorkspaceMember,
  IWorkspaceUser,
  WorkspaceUserStatus,
  TokenTypeEnum,
} from '@multiplayer/types'
import { MultiplayerApi } from '../../services'
import { AMQP_NOTIFICATION_QUEUE } from '../../config'

const sendInviteForActiveWorkspaceUsers = async (
  inviterWorkspaceUser: IWorkspaceUserDocument,
  workspaceUser: IWorkspaceUserDocument,
  emailPayload: any,
) => {
  await AMQP.publish(
    AMQP_NOTIFICATION_QUEUE,
    {
      variables: {
        template: 'DESIGN_REVIEW_NOTIFICATION',
        email: (workspaceUser.user as any)?.primaryEmail,
        data: {
          email: (workspaceUser.user as any)?.primaryEmail,
          user: workspaceUser.user,
          ...emailPayload,
        },
      },
    },
    { durable: false, fanout: false },
  )
}

const sendInviteForPendingWorkspaceUsers = async (
  inviterWorkspaceUser: IWorkspaceUserDocument,
  workspaceUser: IWorkspaceUserDocument,
  emailPayload: any,
) => {
  const inviterUser = await UserModel.findUserById(inviterWorkspaceUser?.user as string)
  const token = await TokenModel.createToken(
    TokenTypeEnum.USER_WORKSPACE_INVITATION,
    workspaceUser.user,
    {
      meta: {
        workspaceUser: workspaceUser._id,
        workspace: workspaceUser.workspace,
        inviterWorkspaceUser: inviterWorkspaceUser._id,
      },
    },
  )

  await AMQP.publish(
    AMQP_NOTIFICATION_QUEUE,
    {
      variables: {
        template: 'INVITE_AND_DESIGN_REVIEW_NOTIFICATION',
        email: (workspaceUser.user as any)?.primaryEmail,
        data: {
          email: (workspaceUser.user as any)?.primaryEmail,
          user: workspaceUser.user,
          token: token.token,
          inviteeWorkspaceUser: inviterWorkspaceUser,
          inviteeUser: inviterUser,
          ...emailPayload,
        },
      },
    },
    { durable: false, fanout: false },
  )
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectBranch = req.projectBranch
    const currentWorkspaceUser = req.workspaceUser as IWorkspaceUserDocument
    const {
      workspaceUsers: workspaceUserIds = [],
      emails,
    } = req.body

    let invitedWorkspaceUserIdsByEmails: IWorkspaceMember[] = []

    if (emails.length) {
      invitedWorkspaceUserIdsByEmails = await MultiplayerApi.inviteUsersToWorkspace(
        `${AuthConfig.COOKIE_NAME}=${req.cookies[AuthConfig.COOKIE_NAME]}`,
        workspaceId,
        emails,
        false,
      )
    }

    const uniqueWorkspaceUserIds = Array.from(new Set([
      ...invitedWorkspaceUserIdsByEmails.map(({ workspaceUser }) => (workspaceUser as IWorkspaceUser)._id),
      ...workspaceUserIds.map(workspaceUserId => workspaceUserId),
    ]))

    const workspaceUserIdsToAddToReviewers = uniqueWorkspaceUserIds
      .filter(workspaceUserId =>
        !projectBranch.reviews.find(({ workspaceUser }) => workspaceUser.equals(workspaceUserId)),
      )

    const branchReviews = await ProjectBranchModel.addReviewers(
      projectBranch._id,
      workspaceUserIdsToAddToReviewers,
    )
    const workspaceUsers = await WorkspaceUserModel.findWorkspaceUserByIds(workspaceUserIdsToAddToReviewers)

    const {
      pendingWorkspaceUsers,
      activeWorkspaceUsers,
    } = workspaceUsers.reduce((acc, workspaceUser) => {
      if (workspaceUser.status === WorkspaceUserStatus.ACTIVE) {
        acc.activeWorkspaceUsers.push(workspaceUser)
      } else {
        acc.pendingWorkspaceUsers.push(workspaceUser)
      }

      return acc
    }, {
      pendingWorkspaceUsers: [],
      activeWorkspaceUsers: [],
    } as {
      pendingWorkspaceUsers: IWorkspaceUserDocument[],
      activeWorkspaceUsers: IWorkspaceUserDocument[]
    })

    const emailPayload = {
      workspace: {
        _id: workspaceId,
      },
      project: {
        _id: projectBranch.project,
      },
      branch: projectBranch,
    }

    // send emails for active users
    await Promise.all(activeWorkspaceUsers.map(workspaceUser =>
      sendInviteForActiveWorkspaceUsers(currentWorkspaceUser, workspaceUser, emailPayload)))

    // send emails for pending users (not part of workspace)
    await Promise.all(pendingWorkspaceUsers.map(workspaceUser =>
      sendInviteForPendingWorkspaceUsers(currentWorkspaceUser, workspaceUser, emailPayload)))

    return res.status(200).json(branchReviews)
  } catch (err) {
    return next(err)
  }
}
